import yargs, { string } from "yargs"
import fg from "fast-glob"
import fsp from "fs/promises"
import * as t from "io-ts"
import * as Adapters from "./lib/adapters"
import { ExtractedInfo } from "./lib/types"
import { flow } from "fp-ts/lib/function"
import * as E from "fp-ts/lib/Either"
import { PathReporter } from "io-ts/lib/PathReporter"

const adapters = Object.values(Adapters)

export const Page = t.type({
  url: t.string,
  html: t.string,
})
type Page = t.TypeOf<typeof Page>

export type PageExtraction = { name: string; info: ExtractedInfo | null }
export type PageExtractions = Array<PageExtraction>
export type PageResult = { page: Page; extractions: PageExtractions }

export const getOrThrowPathReporter = <T>(e: E.Either<t.Errors, T>) => {
  if (E.isRight(e)) return e.right
  else throw new Error(PathReporter.report(e).join("\n"))
}

export const decodeTestPage = flow(
  JSON.parse,
  Page.decode,
  getOrThrowPathReporter
)

export async function runAdaptersFor(page: Page): Promise<PageExtractions> {
  const extractions = []
  for (const adapter of adapters) {
    const start = Date.now()
    const info = await adapter.extract({ ...page })
    extractions.push({
      name: adapter.metadata.name,
      info,
    })
    console.warn(`${adapter.metadata.name} took ${Date.now() - start} ms`)
  }
  return extractions
}

export function createHtmlReport(results: Array<PageResult>) {
  return `
<!DOCTYPE html>
<html doctype="utf8">
  <head>
    <meta charset="utf-8"/>
    <style>
      html { box-sizing:border-box; }
      *,*:before,*:after { box-sizing:inherit; }
      body {
        margin: 8px;
      }
      .table {
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        flex-direction: row;
      }
      .header {
        font-weight: bold;
        text-align: center;
      }
      .cell {
        margin: 1px;
        padding: 4px;
        width: 400px;
        overflow-x: auto;
        border: 1px solid black;
        flex-shrink: 0;
      }
      .cell.iframe {
        overflow: hidden;
        padding: 0;
      }
      .cell > iframe {
        width: 100%;
        height: 100%;
      }
    </style>
    <script>
      window.addEventListener('load', () => {
        // Setup user-initiated loading of iframes
        [...document.querySelectorAll('button[page-src]')].forEach(b => b.addEventListener('click', (ev) => {
          const iframe = document.createElement('iframe')
          iframe.setAttribute('src', b.getAttribute('page-src'))
          b.parentNode.replaceChild(iframe, b)
        }))

        // Add ability to expand all entries with one button
        document.querySelector('#toggle-expanded').addEventListener('click', (ev) => {
          [...document.querySelectorAll('details')].forEach(d => {
            d.open = !d.open
          })
        })
      })
    </script>
  </head>
  <body>
    <button id="toggle-expanded">Toggle expanded</button>
    <div class="table">
      <div class="row header">
        <div class="cell">original source</div>
        ${adapters
          .map(
            (a) =>
              `<div class="cell"><a href="${a.metadata.repoUrl}">${a.metadata.name}</a></div>`
          )
          .join("\n")}
      </div>
      ${results
        .map(
          (pageResult) =>
            `<details>
              <summary>Results for <a href="${pageResult.page.url}">${
              pageResult.page.url
            }</a></summary>

              <div class="row">
                <div class="cell iframe"><button page-src="${
                  pageResult.page.url
                }">Load iframe</button></div>
                ${pageResult.extractions
                  .map(
                    (extraction) =>
                      `<div class="cell">${
                        extraction.info?.simplifiedHtml ?? "Failed"
                      }</div>`
                  )
                  .join("\n")}
              </div>
            </details>`
        )
        .join("\n")}
    </table>
  </body>
</html>
`
}

export async function run() {
  const args = yargs
    .option("testPages", {
      type: "string",
      description:
        "glob pattern specifying pages (wrapped as JSON) to test against",
    })
    .demandOption("testPages")
    .option("reportFile", {
      type: "string",
      description:
        "path of the HTML report that should be written. defaults to stdout if not specified.",
    }).argv

  const results: PageResult[] = []
  const testPagePaths = fg.sync([args.testPages]).sort()
  console.group(
    `Processing ${testPagePaths.length} pages with ${adapters.length} adapters...`
  )
  for (const testPagePath of testPagePaths) {
    const pageStr = await fsp.readFile(testPagePath, "utf8")
    const page = decodeTestPage(pageStr)
    console.group(`Testing ${page.url}`)
    const extractions = await runAdaptersFor(page)
    console.groupEnd()
    results.push({ page, extractions })
  }
  console.groupEnd()

  const report = createHtmlReport(results)
  console.warn(
    `Report is ${Math.ceil(Buffer.byteLength(report, "utf8") / 1024)} KiB`
  )
  if (args.reportFile) await fsp.writeFile(args.reportFile, report, "utf8")
  else process.stdout.write(report + "\n", "utf8")
}

if (require.main === module) {
  run().catch((e) => {
    console.warn(e)
    process.exit(1)
  })
}
