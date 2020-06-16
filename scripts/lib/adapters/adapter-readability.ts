import Readability from "mozilla-readability"
import { JSDOM, VirtualConsole } from "jsdom"
import { Adapter } from "../types"

const blackholeConsole = new VirtualConsole()

const adapter: Adapter = {
  metadata: {
    name: "github:mozilla/readability",
    repoUrl: "https://github.com/mozilla/readability",
    npmUrl: undefined,
  },
  extract({ html, url }) {
    const dom = new JSDOM(html, { url, virtualConsole: blackholeConsole })
    const extracted = new Readability(dom.window.document).parse()
    return (
      extracted &&
      Promise.resolve({
        title: extracted.title,
        simplifiedHtml: extracted.content,
      })
    )
  },
}

export default adapter
