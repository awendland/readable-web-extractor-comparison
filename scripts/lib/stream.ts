import { Readable } from "stream"

/**
 * Read an entire stream into a Buffer
 * @param stream
 */
export const readStream = (stream: Readable) =>
  new Promise((res: (b: Buffer) => void, rej) => {
    const data: Uint8Array[] = []
    stream.on("data", (chunk) => data.push(chunk))
    stream.on("end", () => res(Buffer.concat(data)))
    stream.on("error", rej)
  })
