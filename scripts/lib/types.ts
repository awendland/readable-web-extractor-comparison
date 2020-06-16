export type ExtractedInfo = {
  title?: string
  description?: string
  author?: string
  image?: string
  simplifiedHtml?: string
}

export type ExtractParams = { html: string; url: string }

export type AdapterMetadata = {
  name: string
  repoUrl: string
  npmUrl?: string
}

export type Adapter = {
  metadata: AdapterMetadata
  extract(params: ExtractParams): Promise<ExtractedInfo | null>
}
