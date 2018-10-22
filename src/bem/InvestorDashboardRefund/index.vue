<template>
    <div class="InvestorDashboardRefund buefy" v-if="!langMeta.loading">
        <section class="container">
            <h2>{{ $t('InvestorDashboard') }}</h2>

            <b-notification class="InvestorDashboardRefund__error" v-if="isError" type="is-danger" has-icon>
                <span v-if="ledgerMeta.loadingError">{{ ledgerMeta.loadingError }}</span>
                <span v-if="tokensListMeta.loadingError">{{ tokensListMeta.loadingError }}</span>
                <span v-if="accountMeta.loadingError">{{ accountMeta.loadingError }}</span>
            </b-notification>

            <b-notification v-if="isLoading && !isError" :closable="false" class="InvestorDashboardRefund__loader">
                <span v-if="ledgerMeta.loading">{{ $t('InvestorDashboardLoadLedger') }}<br></span>
                <span v-if="tokensListMeta.loading">{{ $t('InvestorDashboardLoadTokens') }}<br></span>

                <b-loading :is-full-page="false" :active="isLoading" :can-cancel="true"></b-loading>
            </b-notification>

            <div v-if="!isLoading">
                <TokenSwitch v-if="!isCurrentToken"></TokenSwitch>
                <RefundEth></RefundEth>
            </div>
        </section>
        <Steps :number="7" link="/investor-exchange.html"></Steps>
    </div>
</template>

<script>
    import './default.scss';

    import {createNamespacedHelpers} from "vuex";

    import TokenSwitch from 'bem/TokenSwitch';
    import RefundEth from 'bem/RefundEth';
    import Steps from "bem/Steps";

    const LedgerNS = createNamespacedHelpers("Ledger");
    const AccountNS = createNamespacedHelpers("Account");
    const TokensListNS = createNamespacedHelpers("TokensList");
    const LangNS = createNamespacedHelpers("Lang");
    const TransactionsNS = createNamespacedHelpers("Transactions");

    export default {
        name: 'InvestorDashboardRefund',
        components: {
            TokenSwitch,
            RefundEth,
            Steps
        },
        data() {
            return {
                meta: {
                    loading: false,
                }
            };
        },
        computed: {
            ...LedgerNS.mapState({
                ledgerMeta: 'meta',
            }),
            ...TokensListNS.mapState({
                list: "list",
                tokensListMeta: 'meta',
                currentToken: "currentToken"
            }),
            ...AccountNS.mapState({
                currentAccount: "currentAccount",
                currentAccountData: "currentAccountData",
                accountMeta: "meta",
            }),
            ...LangNS.mapState({
                langMeta: 'meta'
            }),

            isLoading() {
                return this.tokensListMeta.loading || this.meta.loading || !this.currentToken || !this.list.length;
            },
            isError() {
                return this.ledgerMeta.loadingError || this.tokensListMeta.loadingError || this.accountMeta.loadingError;
            },
            isCurrentToken(){
                return typeof CurrentToken !== 'undefined';
            }
        },
        methods: {
            ...LedgerNS.mapActions({
                ledgerFetch: "fetch"
            }),
            ...TokensListNS.mapActions({
                tokensListFetch: "fetch",
                tokensListWatch: "watch",
                FetchTokenByCurrentToken: "fetchTokenByCurrentToken"
            }),
            ...AccountNS.mapActions({
                watchCurrentAccount: 'watch',
                updateAccountData: 'updateAccountData',
            }),
            ...TransactionsNS.mapActions({
                transactionsUpStatusTx: "updateStatusTx"
            }),

            async handleCurrentAccountChange(currentAccount) {
                if(currentAccount){
                    await this.transactionsUpStatusTx();
                    if(this.isCurrentToken){
                        await this.FetchTokenByCurrentToken(CurrentToken);
                    } else {
                        await this.tokensListFetch();
                    }
                    await this.updateAccountData();
                    window.dispatchEvent(new Event('resize'));
                    this.meta.loading = false;
                }
            },

            async handleCurrentTokenChange(currentToken) {
                await this.updateAccountData();
            }
        },
        watch: {
            'currentAccount': {
                handler: 'handleCurrentAccountChange',
                immediate: true
            },
            'currentToken': {
                handler: 'handleCurrentTokenChange',
                immediate: true
            }
        },
        async created() {
            this.meta.loading = true;
            await this.watchCurrentAccount();
        }
    };
</script>