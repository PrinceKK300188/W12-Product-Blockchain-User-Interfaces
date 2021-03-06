import { WhiteistedToken } from '@/lib/models/WhiteistedToken';
import { WhitelistedCrowdsale } from '@/lib/models/WhitelistedCrowdsale';
import { isZeroAddress, ZERO_ADDRESS} from '@/lib/utils';
import { BaseWrapper } from 'src/lib/Blockchain/Wrappers/NoVersion/BaseWrapper.js';
import {map, reduce} from 'p-iteration';
import { devLog, devWarn } from '@/lib/dev';


const INDEX_DEPRECATION_WARN = '[OldListedModel] `index` property has been deprecated. Perform code refactoring to avoid using this property.';

const makeOldModel = (tokenExtended, crowdsaleAddress, indexOffset) => {
    const crowdsale = tokenExtended.getCrowdsaleByAddress(crowdsaleAddress);
    const isCrowdsaleInitialized = crowdsale
        ? !crowdsale.isNotInitialized()
        : false;
    const model = {
        _index: crowdsale ? indexOffset + tokenExtended.crowdsales.indexOf(crowdsale) : 0,
        version: tokenExtended.version,
        listerAddress: tokenExtended.listerAddress,
        ledgerAddress: tokenExtended.ledgerAddress,
        wTokenAddress: tokenExtended.wTokenAddress,
        name: tokenExtended.name,
        symbol: tokenExtended.symbol,
        tokenAddress: tokenExtended.tokenAddress,
        decimals: tokenExtended.decimals,
        feePercent: isCrowdsaleInitialized
            ? crowdsale.feePercent
            : tokenExtended.feePercent,
        feeETHPercent: isCrowdsaleInitialized
            ? crowdsale.feeETHPercent
            : tokenExtended.feeETHPercent,
        WTokenSaleFeePercent: isCrowdsaleInitialized
            ? crowdsale.WTokenSaleFeePercent
            : tokenExtended.WTokenSaleFeePercent,
        trancheFeePercent: isCrowdsaleInitialized
            ? crowdsale.trancheFeePercent
            : tokenExtended.trancheFeePercent,
        crowdsaleAddress,
        tokensForSaleAmount: crowdsale ? crowdsale.tokensForSaleAmount : '0',
        wTokensIssuedAmount: crowdsale ? crowdsale.wTokensIssuedAmount : '0',
        tokenOwners: isCrowdsaleInitialized
            ? crowdsale.owners
            : tokenExtended.owners
    };

    Object.defineProperty(model, 'index', {
        enumerable: true,
        configurable: true,
        get() {
            devWarn(INDEX_DEPRECATION_WARN);
            return this._index;
        },
        set(value) {
            devWarn(INDEX_DEPRECATION_WARN);
            return this._index = value;
        }
    });

    return model;
};

export class W12ListerWrapper extends BaseWrapper {
    constructor(contractArtifacts, instance) {
        super(contractArtifacts, instance);

        this.W12CrowdsaleFactory = null;
    }

    setFactories({
        W12CrowdsaleFactory,
        ERC20Factory,
        ERC20DetailedFactory,
        TokenExchangerFactory,
    }) {
        this.W12CrowdsaleFactory = W12CrowdsaleFactory;
        this.ERC20Factory = ERC20Factory;
        this.TokenExchangerFactory = TokenExchangerFactory;
        this.ERC20DetailedFactory = ERC20DetailedFactory;
    }

    async getTokenExtended(tokenAddress) {
        if (!tokenAddress && isZeroAddress(tokenAddress)) throw new Error('token address is not valid');

        const {TokenExchangerFactory} = this;

        const ledgerAddress = await this.methods.getExchanger();
        const TokenExchanger = TokenExchangerFactory.at(ledgerAddress);
        const [
            name,
            symbol,
            decimals,
            owners,
            [
                feePercent,
                feeETHPercent,
                WTokenSaleFeePercent,
                trancheFeePercent
            ]
        ] = await this.methods.getToken(tokenAddress);
        const wTokenAddress = await TokenExchanger.methods.getWTokenByToken(tokenAddress);
        const model = new WhiteistedToken({
            version: this.version,
            listerAddress: this.instance.address,
            ledgerAddress,
            wTokenAddress,
            name,
            symbol,
            tokenAddress,
            decimals: decimals.toString(),
            feePercent: feePercent.toString(),
            feeETHPercent: feeETHPercent.toString(),
            WTokenSaleFeePercent: WTokenSaleFeePercent.toString(),
            trancheFeePercent: trancheFeePercent.toString(),
            crowdsales: await this.getCrowdsalesExtended(tokenAddress),
            owners: owners,
        });

        return model;
    }

    async getCrowdsalesExtended(tokenAddress) {
        const addresses = await this.methods.getCrowdsales(tokenAddress);
        return await map(addresses, (crowdsaleAddress) => this.getCrowdsaleExtended(tokenAddress, crowdsaleAddress));
    }

    async getCrowdsaleExtended(tokenAddress, crowdsaleAddress) {
        const [
            [
                feePercent,
                feeETHPercent,
                WTokenSaleFeePercent,
                trancheFeePercent
            ],
            [
                tokensForSaleAmount,
                wTokensIssuedAmount
            ],
            owners
        ] = await this.methods.getCrowdsale(tokenAddress, crowdsaleAddress);
        const model = new WhitelistedCrowdsale({
            tokenAddress,
            crowdsaleAddress,
            version: this.version,
            feePercent: feePercent.toString(),
            feeETHPercent: feeETHPercent.toString(),
            WTokenSaleFeePercent: WTokenSaleFeePercent.toString(),
            trancheFeePercent: trancheFeePercent.toString(),
            tokensForSaleAmount: tokensForSaleAmount.toString(),
            wTokensIssuedAmount: wTokensIssuedAmount.toString(),
            owners
        });

        return model;
    }

    async getTokensExtended() {
        const addresses = await this.methods.getTokens();
        return await map(addresses, (tokenAddress) => this.getTokenExtended(tokenAddress));
    }

    // TODO: refoctoring
    // keep this methods for backward compatibles

    // do token duplication for each crowdsale
    async fetchComposedTokenInformationByTokenAddress(Token, returnList = false) {
        if(!Token.tokenAddress) {
            throw new Error('token must have `tokenAddress` property');
        }

        if(Token.index == null) {
            devLog(`token index is not defined for token ${Token.tokenAddress}`);
        }

        if(Token.crowdsaleAddress == null) {
            devLog(`token crowdsale address is not defined for token ${Token.tokenAddress}`);
        }

        devLog('[fetchComposedTokenInformationByTokenAddress] arguments', Token, returnList);

        // hack. if we try to fetch token by data provided by customer we look up for `__customerPointer`
        // and if it`s true then use `crowdsaleAddress` property instead of `index`
        const index = Token.__customerPointer ? null : Token.index;
        const crowdsaleAddress = Token.__customerPointer ? Token.crowdsaleAddress : null;

        if (Token.__customerPointer) {
            if (!crowdsaleAddress) {
                throw new Error('customer must provide crowdsale address');
            }
        }

        const {tokenAddress} = Token;
        const tokens = await this.methods.getTokens();
        const indexOffset = tokens.indexOf(tokenAddress);
        const tokenExtended = await this.getTokenExtended(tokenAddress);
        let list;

        const minIndex = indexOffset;
        const maxIndex = indexOffset + (tokenExtended.crowdsales.length > 1 ? tokenExtended.crowdsales.length - 1 : 0);

        if (index != null) {
            if (index < minIndex || index > maxIndex) {
                throw new Error('token index is not in range');
            }
        }

        if (tokenExtended.crowdsales.length) {
            list = tokenExtended.crowdsales.map(c => makeOldModel(tokenExtended, c.crowdsaleAddress, indexOffset));
        } else {
            list = [makeOldModel(tokenExtended, ZERO_ADDRESS, indexOffset)];
        }

        if (returnList) {
            return list;
        } else if (index != null || crowdsaleAddress != null) {
            return list.find(i => {
                if (index != null) return i.index == index;
                if (crowdsaleAddress != null) return i.crowdsaleAddress == crowdsaleAddress;
            });
        } else {
            return list[0];
        }
    }

    async fetchAllTokensInWhiteList() {
        const tokensAddresses = await this.methods.getTokens();
        return await reduce(tokensAddresses, async (list, tokenAddress) => {
            return list.concat(await this.fetchComposedTokenInformationByTokenAddress({ tokenAddress }, true));
        }, []);
    }

    async fetchAllTokensComposedInformation() {
        return await this.fetchAllTokensInWhiteList();
    }

    async swap() {
        return await this.methods.getExchanger();
    }
}
