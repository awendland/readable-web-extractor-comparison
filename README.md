# Readable Web Extractor Comparison

How do various readable website extractor libraries (ie. libraries that provide a feature like [Reader View in Safari](https://support.apple.com/guide/iphone/hide-ads-and-distractions-iphdc30e3b86/ios)) perform?

This repo exists to provide a way to compare **many libraries** at once across **many pages** at once.

Currently the following libraries are implemented:

- [mozilla/readability](https://github.com/mozilla/readability)
- [cleanview](https://github.com/mozilla/readability)
- [metascraper](https://github.com/microlinkhq/metascraper)
- [@postlight/mercury-parser](https://github.com/postlight/mercury-parser)
- TODO - [clean-mark](https://github.com/croqaz/clean-mark) _(377 stars)_
- TODO - [ascrape-js](https://github.com/Mitica/ascrape-js) _(13 stars)_

## Results

The latest output from running the comparisons on a set of 16 random pages selected from Hacker News in June 2020 is available on the `gh-pages` branch ([direct link to report](https://awendland.github.io/readable-web-extractor-comparison/report.html)).

Based on these comparisons [@awendland](https://github.com/awendland) is intending to use the _mozilla/readability_ project.

### Example Report

![Screenshot of generated report with 4 rows toggled closed and 1 row expanded with the original iframe loaded](https://user-images.githubusercontent.com/1152104/84835477-8e20a900-afe8-11ea-84a3-75e81bf7047c.png)

## Usage

Make sure to run `yarn` to ensure all dependencies are installed. Each command should include `--help` documentation and produce explanatory output during execution.

### Fetching Test Pages

Create a newline delimited list of URLs to fetch and store them in a text file such as `test_urls.txt`.

Use the `fetch-test-pages` script to retrieve and save them into a folder such as `test_pages/` for report processing.

```sh
yarn scripts:run ./scripts/fetch-test-pages.ts --listOfUrls test_urls.txt --outDir test_pages/ --parallelism 30
```

They will be saved as JSON files containing information such as the source URL and the HTML contents of the page.

### Generating Comparison Report

Once test pages have been retrieved a report can be generated. The following command would be used to generate a report named `report.html` from test pages saved in `test_pages/`.

```sh
yarn scripts:run ./scripts/generate-report.ts --testPages 'test_pages/*.json' --reportFile report.html
```

## Contributing

### Adding New Libraries for Comparison

Adding a new library to the comparison involves several steps:

1. Add the library (and any associated `@types/` package) as a project dependency

   ```sh
   yarn add LIBRARY_NAME --exact
   ```

2. Authoring an adapter for the library in `scripts/lib/adapters/adapter-LIBRARY_NAME.ts` which conforms to the following type (detailed in `scripts/lib/types.ts`):

   ```ts
   type Adapter = {
     metadata: AdapterMetadata
     extract(params: ExtractParams): Promise<ExtractedInfo | null>
   }
   ```

3. Registering the adapter in `scripts/lib/adapters/index.ts`

4. Generating a report to make sure that it works
