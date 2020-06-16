import cleanview from "cleanview"
import { Adapter } from "../types"

const adapter: Adapter = {
  metadata: {
    name: "cleanview",
    repoUrl: "https://github.com/HersonHN/cleanview",
    npmUrl: "https://www.npmjs.com/package/cleanview",
  },
  async extract({ html, url }) {
    try {
      return { simplifiedHtml: cleanview(html, { url }) }
    } catch (e) {
      return null
    }
  },
}

export default adapter
