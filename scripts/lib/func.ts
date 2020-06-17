import * as TE from "fp-ts/lib/TaskEither"
import * as E from "fp-ts/lib/Either"
import got, { OptionsOfTextResponseBody, RequestError } from "got"
import { Readable } from "stream"
import { readStream } from "./stream"

/**
 * Unwrap the right side of an Either (the "success" side), or throw the left side (optionally
 * processing the left side using `toError` if provided).
 *
 * @param e
 * @param toError
 */
export const getOrThrow = <L, R, E extends Error>(
  e: E.Either<L, R>,
  toError?: (l: L) => E
): R => {
  if (E.isRight(e)) return e.right
  throw toError ? toError(e.left) : e.left
}

/**
 * Read a stream into a buffer.
 * @param s
 */
export const readStreamTE = (s: Readable) =>
  TE.tryCatch(
    () => readStream(s),
    (e) => e
  )

/**
 * Retrieve the contents of a URL using got.
 * @param url
 */
export const fetchPageTE = (url: string, opts?: OptionsOfTextResponseBody) =>
  TE.tryCatch(
    () => got.get(url, opts),
    (e) => e as RequestError
  )
