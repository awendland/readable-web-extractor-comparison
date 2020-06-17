import { Adapter } from "../types"
import makeMetascraper from "metascraper"
import author from "metascraper-author"
import description from "metascraper-description"
import image from "metascraper-image"
import title from "metascraper-title"

const metascraper = makeMetascraper([author(), description(), image(), title()])

const adapter: Adapter = {
  metadata: {
    name: "metascraper",
    repoUrl: "https://github.com/microlinkhq/metascraper",
    npmUrl: "https://www.npmjs.org/package/metascraper",
  },
  async extract({ html, url }) {
    const metadata = await metascraper({ html, url })
    return {
      author: metadata.author,
      description: metadata.description,
      image: metadata.image,
      title: metadata.title,
    }
  },
}

export default adapter
