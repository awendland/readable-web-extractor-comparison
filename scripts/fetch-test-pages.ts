import yargs from "yargs"
import fs from "fs"
import * as t from "io-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { flow } from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import * as A from "fp-ts/lib/Array"
import { getOrThrow, readStreamTE, fetchPageTE } from "./lib/func"
import { batchTraverse } from "fp-ts-contrib/lib/batchTraverse"
import filenamifyUrl from "filenamify-url"
import * as Path from "path"

export const Page = t.type({
  url: t.string,
  html: t.string,
})
type Page = t.TypeOf<typeof Page>

export async function run() {
  const args = yargs
    .option("listOfUrls", {
      type: "string",
      default: "-",
      description:
        "path to a file containing a newline delimited list of URLs, or '-' for stdin",
    })
    .demandOption("listOfUrls")
    .option("outDir", {
      type: "string",
      description:
        "path to the directory that the fetched pages should be stored in",
    })
    .demandOption("outDir")
    .option("timeout", {
      type: "number",
      description:
        "maximum number of milliseconds to wait for each web request",
      default: 5000,
    })
    .option("parallelism", {
      alias: "j",
      type: "number",
      description: "number of parallel fetch requests to run at once",
      default: 10,
    }).argv

  const loadUrls = pipe(
    args.listOfUrls === "-"
      ? process.stdin
      : fs.createReadStream(args.listOfUrls),
    readStreamTE,
    TE.map(
      flow(
        (b) => b.toString("utf8"),
        (s) =>
          s
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
      )
    )
  )

  const urls = getOrThrow(await loadUrls())

  const fetchTestPage = (url: string) =>
    pipe(
      fetchPageTE(url, { timeout: args.timeout }),
      TE.map((r) => ({ html: r.body, url }))
    )

  const writeFile = TE.taskify(fs.writeFile)
  const mkdirp = (
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, path: string) => void
  ) => fs.mkdir(path, { recursive: true }, callback)
  const mkdirpTE = TE.taskify(mkdirp)
  const writeFileForce = (path: string, data: string) =>
    pipe(
      mkdirpTE(Path.dirname(path)),
      TE.chain(() => writeFile(path, data))
    )

  const makeOutPath = (url: string) =>
    Path.join(args.outDir, filenamifyUrl(url) + ".json")

  const fetchAndSavePage = flow(
    (url: string) => {
      console.log(`Fetching ${url}`)
      return url
    },
    fetchTestPage,
    TE.chain((p) => {
      const data = JSON.stringify(p, null, 2)
      const path = makeOutPath(p.url)
      console.log(`Saving ${path}`)
      return writeFileForce(path, data)
    })
  )

  console.group("Running...")
  await batchTraverse(TE.taskEither)(
    A.chunksOf(args.parallelism)(urls),
    (url) =>
      pipe(
        fetchAndSavePage(url),
        TE.orElse((e) => {
          console.log(`Error for ${url}`, e)
          return TE.taskEither.of(undefined as unknown)
        })
      )
  )()
  console.groupEnd()
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
