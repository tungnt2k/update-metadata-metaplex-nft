#!/usr/bin/env node
import { program } from 'commander';
import { PublicKey, Connection, clusterApiUrl, Cluster } from '@solana/web3.js';
import { programs, actions, NodeWallet } from '@metaplex/js';
import { loadData, saveMetaData, loadWalletKey, MetadataCacheContent } from './utils';

const {
    metadata: { Metadata, MasterEdition, MetadataDataData, Creator },
} = programs;

// const RPC_CLUSTER_API = 'https://solana-api.projectserum.com';
const RPC_CLUSTER_API = 'https://api.devnet.solana.com';
const RPC_CLUSTER = RPC_CLUSTER_API;

const getConnection = (env: string) => {
    const cluster = env === 'mainnet-beta' ? RPC_CLUSTER : clusterApiUrl(env as Cluster);
    const connection = new Connection(cluster);
    return connection;
};

const getTokenMetadata = async (connection: Connection, tokenMint: string) => {
    const metadataPDA = await Metadata.getPDA(new PublicKey(tokenMint));
    const tokenMetadata = await Metadata.load(connection, metadataPDA);
    const editionPDA = await MasterEdition.getPDA(new PublicKey(tokenMint));
    const tokenEdition = await MasterEdition.load(connection, editionPDA);

    return {
        addr: {
            metadata: metadataPDA.toString(),
            edition: editionPDA.toString(),
        },
        metadata: tokenMetadata.data,
        edition: tokenEdition.data,
    };
};

program.version('0.0.1');

program
    .command('download-metadata')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .action(async (_directory, cmd) => {
        const { env } = cmd.opts();
        const data = loadData() as string[];
        if (!data) {
            throw new Error('You need provide both token list and updated metadata json files');
        }

        const connection = getConnection(env);

        console.log(`Reading metadata for: ${data.length} items`);
        console.log('Get the token metadata from the chain...');

        const result = {};

        for (let index = 0; index < data.length; index++) {
            const key = data[index];
            const { metadata } = await getTokenMetadata(connection, key);
            result[key] = metadata;
        }

        console.log('Decode the token metadata, this WILL take a while');

        console.log('Save the metadata loaded from the chain');

        // at this point we have the metadata loaded from the chain
        saveMetaData(JSON.stringify(result, null, 2));

        console.log('result >>> ', result);
    });

const defaultCacheFilePath = 'data/current-metadata-cache.json';
program
    .command('update')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-c, --cache-name <string>', 'Cache file name', `./${defaultCacheFilePath}`)
    .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        const { cacheName, env, keypair } = cmd.opts();

        const metadataPath = cacheName ?? `../${defaultCacheFilePath}`;
        const walletKeyPair = loadWalletKey(keypair);
        console.log(`Running on '${env}' network`);
        const metadataCacheJson = loadData(metadataPath) as MetadataCacheContent;

        const connection = getConnection(env);

        // failed to update tokens will be stored here and output at the end
        const failed = [];

        // next wee need to update using updateMetadataInstruction
        for (const [key, val] of Object.entries(metadataCacheJson)) {
            console.log(`Updating token #${key} ...`);

            try {
                const creators = [new Creator(val.data.creators[0])];
                const data = {
                    ...val.data,
                    creators,
                };
                const updateData = new MetadataDataData(data);

                const updateMetadataResponse = await actions.updateMetadata({
                    connection,
                    wallet: new NodeWallet(walletKeyPair),
                    editionMint: new PublicKey(val.mint),
                    newMetadataData: updateData,
                });

                console.log('✅ Tx was successful! ID: ', updateMetadataResponse);
            } catch (error) {
                failed.push(key);
                console.warn(`🚫 Items: ${key} failed to update with error:`, error.message);
            }
        }

        console.log(`${Object.entries(metadataCacheJson).length} items have been updated!`);

        if (failed.length) {
            console.log('🚫 List of failed to update tokens: ', failed);
            console.log('Try rerun script on this tokens only.');
        } else {
            console.log('🚫 No failed transactions. Life is good! 😎');
        }
    });

program.parse(process.argv);
