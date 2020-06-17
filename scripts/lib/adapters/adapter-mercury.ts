import Mercury from "@postlight/mercury-parser"
import { Adapter } from "../types"

const adapter: Adapter = {
  metadata: {
    name: "@postlight/merucry-parser",
    repoUrl: "https://github.com/postlight/mercury-parser",
    npmUrl: "https://www.npmjs.com/package/@postlight/mercury-parser",
  },
  async extract({ html, url }) {
    const extracted = await Mercury.parse(url, {
      // Need to pass the html as a Buffer because otherwise Mercury gets the encoding wrong
      html: Buffer.from(html),
    })
    return {
      title: extracted.title ?? undefined,
      description: extracted.excerpt ?? undefined,
      author: extracted.author ?? undefined,
      image: extracted.lead_image_url ?? undefined,
      simplifiedHtml: extracted.content ?? undefined,
    }
  },
}

export default adapter
