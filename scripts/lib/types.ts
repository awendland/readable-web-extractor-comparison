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
  /**
   * Extracted info should be populated with as much information as possible from the
   * library being tested, but the key focus is on `simplifiedHtml`.
   *
   * If the library fails to extract any data then `null` should be returned. Errors should
   * not be thrown, if they are thrown they should be converted into a `null` by the adapter's
   * caller.
   * @param params
   */
  extract(params: ExtractParams): Promise<ExtractedInfo | null>
}
