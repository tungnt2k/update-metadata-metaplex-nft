import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { programs, actions, NodeWallet, utils } from '@metaplex/js';

const {
    metadata: { Metadata },
} = programs;

const DATA_DIRECTORY = '../src/data/';
const METADATA_FILE = 'current-metadata-cache.json';

export type MetadataCacheContent = {
    [key: string]: programs.metadata.MetadataData;
};

export type ArweaveLinks = {
    [index: string]: {
        link: string;
        name: string;
        imageUri?: string;
    };
};

export type MetaplexCacheJson = {
    program: unknown;
    items: ArweaveLinks;
};

type JsonFileContent = string[] | MetadataCacheContent | MetaplexCacheJson;

export const loadData = (file = `${DATA_DIRECTORY}token-list-to-parse.json`): JsonFileContent => {
    const defaultJson = [];
    const thePath = path.resolve(__dirname, file);
    try {
        return fs.existsSync(thePath) ? JSON.parse(fs.readFileSync(thePath).toString()) : defaultJson;
    } catch {
        return defaultJson;
    }
};

export const saveMetaData = (metadata: string, directory = DATA_DIRECTORY, fileName = METADATA_FILE): void => {
    const theDirectory = path.resolve(__dirname, directory);
    if (!fs.existsSync(theDirectory)) {
        fs.mkdirSync(theDirectory);
    }
    const thePath = path.resolve(__dirname, directory, fileName);
    fs.writeFileSync(thePath, metadata);
};

export function chunks<T>(array: T[], size: number): T[][] {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) =>
        array.slice(index * size, (index + 1) * size),
    );
}

/**
 * Load wallet from local file
 */
export function loadWalletKey(keypair): Keypair {
    if (!keypair || keypair == '') {
        throw new Error('Keypair is required!');
    }
    const loaded = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())));

    console.log(`wallet public key: ${loaded.publicKey}`);
    return loaded;
}

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};
