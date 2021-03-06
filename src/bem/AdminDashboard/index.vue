<template>
    <div class="AdminDashboard buefy" v-if="!langMeta.loading">
        <section class="container">

            <h2 v-html="$t('AdminDashboard')"></h2>
            <ListerSwitch></ListerSwitch>

            <b-notification class="AdminDashboard__error" v-if="isError && !isLoading" type="is-danger" :closable="false" has-icon>
                <span v-if="ledgerMeta.loadingError">{{ $t(ledgerMeta.loadingError) }}</span>
                <span v-if="tokensListMeta.loadingError">{{ $t(tokensListMeta.loadingError) }}</span>
                <span v-if="accountMeta.loadingError">{{ $t(accountMeta.loadingError) }}</span>
            </b-notification>

            <b-notification v-if="isLoading && !isError" :closable="false" class="AdminDashboard__loader">
                <p v-html="$t('InvestorDashboardLoadLedger')"></p>

                <b-loading :is-full-page="false" :active="isLoading" :can-cancel="true"></b-loading>
            </b-notification>

            <div v-if="!isLoading && currentAccount">
                <component :is="WhiteListTableComponent"></component>
                <WhiteListForm></WhiteListForm>
            </div>
        </section>
        <Steps :number="4"></Steps>
    </div>
</template>

<script>
    import './default.scss';
    import { resolveComponentVersion } from '@/bem/utils';

    import ListerSwitch from 'bem/ListerSwitch';
    import Steps from "bem/Steps";
    import WhiteListForm from "bem/WhiteListForm";

    import {createNamespacedHelpers} from "vuex";
    import { CONFIG_UPDATE } from 'store/modules/Config';

    const LedgerNS = createNamespacedHelpers("Ledger");
    const AccountNS = createNamespacedHelpers("Account");
    const WhitelistNS = createNamespacedHelpers("Whitelist");
    const LangNS = createNamespacedHelpers("Lang");
    const ConfigNS = createNamespacedHelpers("Config");

    export default {
        name: 'AdminDashboard',
        template: '#AdminDashboardTemplate',
        components: {
            ListerSwitch,
            WhiteListForm,
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
            ...WhitelistNS.mapState({
                tokensListMeta: 'meta',
                tokensList: "list"
            }),
            ...AccountNS.mapState({
                currentAccount: "currentAccount",
                accountMeta: "meta",
            }),
            ...LangNS.mapState({
                langMeta: 'meta'
            }),
            ...ConfigNS.mapState({
                W12Lister: 'W12Lister',
                W12ListerList: 'W12ListerList'
            }),
            ...ConfigNS.mapGetters({
                W12ListerLastVersion: 'W12ListerLastVersion'
            }),

            isLoading() {
                return this.tokensListMeta.loading && this.meta.loading;
            },
            isError() {
                return this.ledgerMeta.loadingError || this.tokensListMeta.loadingError || this.accountMeta.loadingError;
            },
            WhiteListTableComponent(){
                const v = resolveComponentVersion(this.W12Lister.version, 'WhiteListTable');
                return () => import("bem/WhiteListTable/" + v);
            },
            nextStepBlocked(){
                return this.isPendingTx ? this.$t('StepsBlockedTx') : false;
            }
        },
        methods: {
            ...WhitelistNS.mapActions({
                fetchWhitelist: "fetch",
            }),
            ...AccountNS.mapActions({
                watchCurrentAccount: 'watch',
            }),
            ...ConfigNS.mapMutations({
                updateLister: CONFIG_UPDATE,
            }),

            async handleW12ListerChange(){
                await this.fetchWhitelist();
            },
        },
        watch: {
            'W12Lister': {
                handler: 'handleW12ListerChange'
            },
        },
        async created() {
            this.meta.loading = true;

            await this.watchCurrentAccount();

            if (
                this.W12Lister
                && this.W12ListerLastVersion
                && this.W12Lister.address != this.W12ListerLastVersion.address
            ) {
                this.updateLister({ W12Lister: this.W12ListerLastVersion });
            } else {
                await this.fetchWhitelist();
            }

            this.meta.loading = false;
            window.dispatchEvent(new Event('resize'));
        },
    };
</script>
