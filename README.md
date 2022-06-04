# Script to update Metaplex NFT Token Metadata

This script updates existing NFTs (replaces json metadata)
It have 2 commands: `download-meta` current metadata and `update` with new metadata.

## Prepare

Install dependencies.

```
yarn
```

Place all your tokens addresses (mint id) as string array to the `./src/data/token-list-to-parse.json`.

## Download current meta.

You need download existing metadata for further reuse on `update` command. Run

```
yarn download-metadata
```

It will get array of tokens from `./src/data/token-list-to-parse.json` and fetch all metadata to the file `src/data/current-metadata-cache.json` (May take ~1hr for 1k items).

```
yarn run update --keypair <PATH_TO_LOCAL_KEYPAIR> --env mainnet-beta
```
