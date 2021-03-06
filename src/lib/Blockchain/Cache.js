import { devLog } from '@/lib/dev';
import stringHash from 'string-hash';
import store from 'store';
import {CACHE_MAP} from 'src/config';
import Web3 from 'web3';
import coder from 'web3/lib/solidity/coder';
import * as Sentry from "@sentry/browser";

const web3 = new Web3();
const BigNumber = web3.BigNumber;
const CACHE_TYPE = ['permanent'];
const processCacheType = (type) => CACHE_TYPE.includes(type) ? type : undefined;
const getPayload = (args, inputTypes) => {
    args = Array.from(args);
    if (args.length > inputTypes.length) {
        args = args.slice(0, inputTypes.length);
    }
    return args;
}
const getOptions = (args, inputTypes) => {
    if (args.length > inputTypes.length) {
        return typeof args[args.length - 1] === 'object' ? args[args.length - 1] : undefined;
    }
}
const processResultForCenstry = (info, args, error, result) => {
    const title = [info.type, info.contract_name, info.name, info.version, info.address].join(' ');
    Sentry.configureScope((scope) => {
        scope.setExtra("args", args);
        scope.setExtra("result", result);
        scope.setTag("Type", info.type);
        scope.setTag("ContractName", info.contract_name);
        scope.setTag("Name", info.name);
        scope.setTag("Version", info.version);
        scope.setTag("Address", info.address);
    });
    if (error != null) {
        Sentry.configureScope((scope) => {
            scope.setLevel("error");
        });
        Sentry.captureMessage(title);
    } else {
        Sentry.configureScope((scope) => {
            scope.setLevel("info");
        });
        Sentry.captureMessage(title);
    }
};

export function cacheController(meta, info) {
    return function (...args) {
        return new Promise(async (accept, reject) => {
            const blockNumber = await store.dispatch('Cache/getBlockNumber');

            let hash;

            const options = getOptions(args, meta.inputTypes);
            const payload = getPayload(args, meta.inputTypes);
            const encodedPayload = coder.encodeParams(meta.inputTypes, payload);
            const encodedOptions = options ? JSON.stringify(options) : '';
            const postfix = encodedPayload + encodedOptions;
            const type = options ? processCacheType(options.cache) : undefined;

            devLog(`request(${meta.method}): `, payload, meta.outputTypes);

            meta.typeCache = type ? type : meta.typeCache;

            switch (meta.typeCache) {
                case 'permanent':
                    hash = stringHash(meta.address + meta.method + postfix);
                    break;

                default:
                    hash = stringHash(meta.address + meta.method + postfix + blockNumber);
                    break;
            }

            devLog(`cache_hash(${meta.method}): `, hash);

            const callback = function (error, result) {
                processResultForCenstry(info, args, error, result);

                if (error != null) {
                    reject(error);
                    return;
                }

                devLog(`result(${meta.method}): `, result, meta.outputTypes);

                const encodedResult = coder.encodeParams(
                    meta.outputTypes,
                    meta.outputTypes.length === 1 ? [result] : result
                );

                store.dispatch('Cache/set', {meta, hash, result: encodedResult, blockNumber, args: {...args}});
                accept(result);
            };

            const cacheData = store.getters["Cache/get"](hash);

            devLog(`cache_record(${meta.method}): `, cacheData);

            if (cacheData) {
                let output = coder.decodeParams(meta.outputTypes, cacheData.result);
                output = meta.outputTypes.length === 1 ? output[0] : output
                devLog(`result(${meta.method}): `, output, meta.outputTypes);
                accept(output);
                return;
            }

            meta.funct(...args, callback);
        });
    };
}

export function getCacheType(version, name, method) {
    for (let type in CACHE_MAP) {
        const versions = CACHE_MAP[type];
        const contracts = versions ? versions[version] : false;
        const methods = contracts ? contracts[name] : false;

        if (methods && methods.includes(method)) {
            return type;
        }
    }
    return false;
}
