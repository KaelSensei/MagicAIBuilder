/**
 * The in-memory fake of the `CardSource` port, for the slice 2 loader's tests and anything else
 * that consumes bulk card data without HTTP. It serves the files it is given as plain text
 * through the same reader as the Scryfall adapter, so skips, counts, hashes and line failures
 * behave alike; the shared contract (`card-source-contract.ts`) holds both to it.
 *
 * @module card-data/testing/in-memory-card-source
 */
import type { BulkFileDescriptor } from "@/lib/card-data/bulk-file";
import type { CardSource } from "@/lib/card-data/card-source";
import { readBulkFile } from "@/lib/card-data/read-bulk-file";
import {
  recordedBulkText,
  recordedDescriptors,
  streamOf,
} from "./recorded-bulk-files";

/** One file the fake serves: its descriptor and its JSON Lines text, uncompressed. */
export interface InMemoryBulkFile {
  readonly descriptor: BulkFileDescriptor;
  readonly text: string;
}

/**
 * Builds a source that lists `files` in order and reads each from its text.
 *
 * @throws Error from `readBulkFile` when asked for a descriptor it does not hold, a test bug
 */
export function createInMemoryCardSource(
  files: readonly InMemoryBulkFile[]
): CardSource {
  const textByUri = new Map(
    files.map((file) => [file.descriptor.downloadUri, file.text])
  );
  return {
    listBulkFiles: async () => ({
      status: "listed",
      files: files.map((file) => file.descriptor),
    }),
    readBulkFile: (request) =>
      readBulkFile({
        ...request,
        open: async () => {
          const text = textByUri.get(request.descriptor.downloadUri);
          if (text === undefined)
            throw new Error(`no file at ${request.descriptor.downloadUri}`);
          return { kind: "opened", body: streamOf([text]), gzip: false };
        },
      }),
  };
}

/** The fake over the recorded index and excerpts of 2026-11-20. */
export function createRecordedCardSource(): CardSource {
  return createInMemoryCardSource(
    recordedDescriptors().map((descriptor) => ({
      descriptor,
      text: recordedBulkText(descriptor.type),
    }))
  );
}
