<template>
    <div class="ProjectStages__stage">
        <div class="row align-items-center justify-content-left">
            <div class="col-auto">
                <span class="ProjectDashboard__step-badge step-badge badge badge-pill badge-light">6</span>
            </div>
            <div class="col-sm-5" v-html="$t('ProjectDashboardStageBonuses')"></div>
            <div class="col-12">
                <div v-if="isCrowdsaleInited && hasPlacedWTokenAddress" class="text-left">
                    <div class="pm-2" v-if="isPendingTx">
                        <p class="py-2"><span v-html="$t('WaitingConfirm')"></span>:</p>
                        <b-tag class="py-2">{{isPendingTx.hash}}</b-tag>
                    </div>
                    <div class="pm-2" v-if="isErrorTx">
                        <p class="py-2"><span v-html="$t('TransactionFailed')"></span>:</p>
                        <b-tag class="py-2">{{isErrorTx.hash}}</b-tag>
                        <div class="pt-2 text-left">
                            <button class="btn btn-primary btn-sm" @click="TransactionsRetry(isErrorTx)" v-html="$t('ToRetry')"></button>
                        </div>
                    </div>
                    <div class="ProjectDashboard__setup card" v-if="!isPendingTx">
                        <div class="card-content">
                            <div class="content" v-if="tokenCrowdSaleStages.length">
                                <div class="ProjectDashboard__stageBonus card"
                                     v-for="(stage, stageIndex) in tokenCrowdSaleStages" :key="stageIndex">
                                    <div class="col-12 pb-4">
                                        <div class="p-3 row align-items-center justify-content-between">
                                            <span class="ProjectDashboard__stageTitle"><span
                                                    v-html="$t('ProjectDashboardStageBonusesStage')"></span> #{{ stageIndex+1 }}</span>
                                            <button class="btn btn-primary btn-sm" :disabled="isStartCrowdSale"
                                                    @click="deleteStageAt(stageIndex)"
                                                    v-html="$t('ProjectDashboardStageBonusesRemove')">
                                            </button>
                                        </div>
                                        <div class="ProjectDashboard__stageBonus col-sm py-2">
                                            <div class="row justify-content-between">
                                                <div class="col-sm py-2">
                                                    <label v-html="$t('ProjectDashboardStageBonusesStartDateLabel')"></label>
                                                    <b-field class="ProjectDashboard__dateSelect">
                                                        <date-picker
                                                                :not-before="getNotBeforeStart(stageIndex)"
                                                                :not-after="getNotAfterStart(stageIndex)"
                                                                v-model="tokenCrowdSaleStages[stageIndex].startDate"
                                                                type="datetime"
                                                                :lang="translationsDef"
                                                                format="YYYY-MM-DD HH:mm"
                                                                :disabled="isStartCrowdSale"
                                                                confirm
                                                                :time-picker-options="{ start: '00:00', step: '00:10', end: '23:50'}"
                                                        ></date-picker>
                                                    </b-field>
                                                </div>
                                                <div class="col-sm py-2">
                                                    <label v-html="$t('ProjectDashboardStageBonusesEndDateLabel')"></label>
                                                    <b-field class="ProjectDashboard__dateSelect">
                                                        <date-picker
                                                                :not-before="getNotBeforeEnd(stageIndex)"
                                                                :not-after="getNotAfterEnd(stageIndex)"
                                                                v-model="tokenCrowdSaleStages[stageIndex].endDate"
                                                                type="datetime"
                                                                :lang="translationsDef"
                                                                :disabled="isStartCrowdSale"
                                                                format="YYYY-MM-DD HH:mm"
                                                                confirm
                                                                :time-picker-options="{ start: '00:00', step: '00:10', end: '23:50'}"
                                                        ></date-picker>
                                                    </b-field>
                                                </div>
                                            </div>
                                            <div class="row justify-content-between">
                                                <div class="col-sm py-2">
                                                    <label for="StageDiscount"
                                                           v-html="$t('ProjectDashboardStageBonusesDiscountLabel')"></label>
                                                    <b-field id="StageDiscount">
                                                        <b-input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                :disabled="isStartCrowdSale"
                                                                v-model="tokenCrowdSaleStages[stageIndex].discount"
                                                                icon="sale">
                                                        </b-input>
                                                    </b-field>
                                                </div>
                                                <div class="col-sm py-2">
                                                    <label for="StageVestingDate"
                                                           v-html="$t('ProjectDashboardStageBonusesVestingDateLabel')"></label>
                                                    <b-field id="StageVestingDate"
                                                             class="ProjectDashboard__dateSelect">
                                                        <date-picker
                                                                v-model="tokenCrowdSaleStages[stageIndex].vestingDate"
                                                                type="datetime"
                                                                :lang="translationsDef"
                                                                :disabled="isStartCrowdSale"
                                                                format="YYYY-MM-DD HH:mm"
                                                                :time-picker-options="{ start: '00:00', step: '00:10', end: '23:50'}"
                                                                confirm></date-picker>
                                                    </b-field>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="p-3 row align-items-center justify-content-between">
                                            <span class="ProjectDashboard__stageTitle"
                                                  v-html="$t('ProjectDashboardStageBonusesVolume')"></span>
                                        </div>
                                        <div class="col-sm py-2">
                                            <div v-for="(bonusVolume, bonusVolumeIndex) in stage.bonusVolumes"
                                                 :key="bonusVolumeIndex">
                                                <div class="row justify-content-between">
                                                    <div class="col-sm py-2">
                                                        <label v-if="bonusVolumeIndex === 0" for="bonusVolumeETH"
                                                               v-html="$t('ProjectDashboardStageBonusesFieldsTitle', { currency: 'USD' })"></label>
                                                        <b-field id="bonusVolumeUSD">
                                                            <b-input
                                                                    placeholder="USD"
                                                                    type="number"
                                                                    :disabled="isStartCrowdSale"
                                                                    min="0"
                                                                    :step="0.0001"
                                                                    v-model="tokenCrowdSaleStages[stageIndex].bonusVolumes[bonusVolumeIndex][0]"
                                                                    icon="currency-usd">
                                                            </b-input>
                                                        </b-field>
                                                    </div>
                                                    <div class="col-sm py-2">
                                                        <div class="row">
                                                            <div class="col-md-8">
                                                                <label v-if="bonusVolumeIndex === 0"
                                                                       for="bonusVolumePercent"
                                                                       v-html="$t('ProjectDashboardStageBonusesBonus')"></label>
                                                                <b-field id="bonusVolumePercent">
                                                                    <b-input
                                                                            type="number"
                                                                            min="0"
                                                                            :disabled="isStartCrowdSale"
                                                                            max="100"
                                                                            v-model="tokenCrowdSaleStages[stageIndex].bonusVolumes[bonusVolumeIndex][1]"
                                                                            icon="sale">
                                                                    </b-input>
                                                                </b-field>
                                                            </div>
                                                            <div class="ProjectDashboard__deleteContainer col-md-2">
                                                                <a class="delete is-large"
                                                                   v-if="!isStartCrowdSale"
                                                                   @click="deleteBonusVolumesAt(stageIndex, bonusVolumeIndex)"></a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                            <div class="text-left pt-2">
                                                <button class="btn btn-primary btn-sm"
                                                        :disabled="isStartCrowdSale"
                                                        @click="addBonusVolumesAt(stageIndex)"
                                                        v-html="$t('ProjectDashboardStageBonusesAddButton')">
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer class="card-footer" v-if="!isStartCrowdSale">
                                <a class="card-footer-item" @click="addStage"
                                   v-html="$t('ProjectDashboardStageBonusesAddStageButton')"></a>
                            </footer>
                        </div>
                    </div>
                    <div class="ProjectDashboard__setup card" v-if="!isPendingTx && checkAddMilestone">
                        <div class="card-content">
                            <div class="p-3" v-if="tokenCrowdSaleMilestones.length">
                                <h2 class="col-12 pb-4" v-html="$t('Milestones')"></h2>
                                <div v-for="(item, idx) in tokenCrowdSaleMilestones">
                                    <span class="Milestones__stageTitle"><span v-html="$t('MilestoneTitle')"></span> #{{ idx }}</span>
                                    <MilestoneCard
                                            :value="tokenCrowdSaleMilestones[idx]"
                                            @input="onMilestoneUpdateAtIndex($event, idx)"
                                            :tranche-percent-valid-flag="milestonesValidFlags[idx].tranchePercent"
                                            :stageIndex="idx"
                                            @delete="onDelete"
                                            :key="idx"
                                    ></MilestoneCard>
                                </div>
                            </div>

                            <footer class="card-footer" v-if="!isStartCrowdSale">
                                <a class="card-footer-item" @click="addMilestone" v-html="$t('MilestonesAdd')"></a>
                            </footer>
                        </div>
                    </div>

                    <b-notification class="ProjectStages__errorStage" v-if="error" @close="error = false"
                                    type="is-danger" has-icon>{{ $t(error) }}
                    </b-notification>
                </div>
            </div>
        </div>
        <b-loading :is-full-page="false" :active.sync="saveLoading" :can-cancel="true"></b-loading>
    </div>
</template>

<script>
    import './default.scss';
    import Connector from 'lib/Blockchain/DefaultConnector.js';
    import DatePicker from 'vue2-datepicker';
    import {createNamespacedHelpers} from "vuex";
    import {MilestoneModel} from './shared.js';
    import {waitTransactionReceipt} from 'lib/utils.js';
    import MilestoneCard from './MilestoneCard.vue';
    import {UPDATE_TX} from "store/modules/Transactions.js";
    import moment from "moment";

    const ConfigNS = createNamespacedHelpers('Config');
    const ProjectNS = createNamespacedHelpers("Project");
    const LedgerNS = createNamespacedHelpers("Ledger");
    const AccountNS = createNamespacedHelpers("Account");
    const TransactionsNS = createNamespacedHelpers("Transactions");
    const LangNS = createNamespacedHelpers("Lang");

    const web3 = new Web3();
    const BigNumber = web3.BigNumber;

    export default {
        name: 'StageCrowdsaleSetup',
        props: {
            stages: Array,
            milestones: Array
        },
        template: '#StageCrowdsaleSetupTemplate',
        created() {
            this.__statusWatcher = this.$watch(
                () => this.checkSetupCrowdsale,
                (value, prevValue) => this.$emit('ready-status', value),
                { immediate: true }
            );
        },
        beforeDestroy() {
            this.__statusWatcher();
        },
        data() {
            return {
                tokenCrowdSaleStages: [],
                saveLoading: false,
                tokenCrowdSaleMilestones: [],
                milestonesValidFlags: [],
                error: false,
            };
        },
        components: {
            DatePicker,
            MilestoneCard
        },
        watch: {
            'tokenCrowdSaleStagesNS': {
                handler(value) {
                    this.tokenCrowdSaleStages = value;
                },
                immediate: true
            },
            'tokenCrowdSaleMilestonesNS': {
                handler(value) {
                    this.tokenCrowdSaleMilestones = value;
                },
                immediate: true
            },
            'tokenCrowdSaleStages': {
                handler(value) {
                    this.$emit('update:stages', value);
                },
                deep: true,
                immediate: true
            },
            'tokenCrowdSaleMilestones': {
                handler (value) {
                    this.resetMilestonesValidFlags();
                    this.$emit('update:milestones', value);
                },
                deep: true,
                immediate: true
            },
        },
        computed: {
            ...ProjectNS.mapState({
                currentProject: "currentProject",
                ProjectMeta: "meta",
            }),
            ...LangNS.mapState({
                translationsDef: 'current'
            }),
            ...ProjectNS.mapGetters([
                'hasAllowance',
                'hasPlacedWTokenAddress',
                'tokensAmountThatApprovedToPlaceByTokenOwnerToNumber',
                'isCrowdsaleInited',
                'tokensForAddCrowdsale',
                'tokensForSaleAmountToNumber',
                'tokenCrowdSaleStagesNS',
                'isStartCrowdSale',
                'endDateCrowdSale',
                'tokenCrowdSaleMilestonesNS'
            ]),
            ...AccountNS.mapState({
                currentAccount: "currentAccount",
                accountMeta: "meta",
            }),
            ...ConfigNS.mapState({
                W12Lister: "W12Lister"
            }),
            ...TransactionsNS.mapState({
                TransactionsList: "list"
            }),

            checkAddMilestone(){
                const St = this.tokenCrowdSaleStages;
                return St && St.length && St.every((st) => st.startDate && st.endDate);
            },
            checkSetupCrowdsale() {
                if (this.tokenCrowdSaleMilestones) {
                    return this.tokenCrowdSaleMilestones.length
                        && this.checkAddMilestone
                        && this.getMilestonesTotalTranchePercent() === 100
                        && this.tokenCrowdSaleMilestones.every(this.validateMilestone);
                }
                return false;
            },
            isErrorTx() {
                return this.TransactionsList && this.TransactionsList.length
                    ? this.TransactionsList.find((tr) => {
                        return tr.token
                        && tr.name
                        && tr.hash
                        && tr.status
                        && tr.token === this.currentProject.tokenAddress
                        && tr.name === "crowdsaleSetup"
                        && tr.status === "error"
                            ? tr
                            : false
                    })
                    : false;
            },
            isPendingTx() {
                return this.TransactionsList && this.TransactionsList.length
                    ? this.TransactionsList.find((tr) => {
                        return tr.token
                        && tr.name
                        && tr.hash
                        && tr.status
                        && tr.token === this.currentProject.tokenAddress
                        && tr.name === "crowdsaleSetup"
                        && tr.status === "pending"
                            ? tr
                            : false
                    })
                    : false;
            }
        },
        methods: {
            ...ProjectNS.mapActions({
                fetchProjects: "fetchProjects",
            }),
            ...LedgerNS.mapActions({
                LedgerFetch: 'fetch',
            }),
            ...TransactionsNS.mapActions({
                TransactionsRetry: "retry"
            }),

            onDelete(value) {
                const index = this.tokenCrowdSaleMilestones.indexOf(value);
                if (index !== -1) {
                    this.tokenCrowdSaleMilestones.splice(index, 1);
                }
            },
            addMilestone() {
                const sum = this.getMilestonesTotalTranchePercent();
                const number = this.tokenCrowdSaleMilestones.length + 1;
                this.tokenCrowdSaleMilestones.push(new MilestoneModel({
                    name: `Milestone ${number}`,
                    description: `Milestone ${number} description`,
                    tranchePercent: sum > 100 ? 0 : 100 - sum,
                    wasCreated: false
                }))
            },
            addStage() {
                this.tokenCrowdSaleStages.push({
                    startDate: null,
                    endDate: null,
                    discount: null,
                    vestingDate: null,
                    bonusVolumes: [],
                    wasCreated: false
                });
            },
            deleteStageAt(stageIndex) {
                this.tokenCrowdSaleStages.splice(stageIndex, 1);
            },
            addBonusVolumesAt(stageIndex) {
                this.tokenCrowdSaleStages[stageIndex].bonusVolumes.push(['', '']);
            },
            deleteBonusVolumesAt(stageIndex, volumeIndex) {
                this.tokenCrowdSaleStages[stageIndex].bonusVolumes.splice(volumeIndex, 1);
            },

            getNotBeforeStart(stageIndex) {
                if (this.tokenCrowdSaleStages[stageIndex - 1]) {
                    for (let i = stageIndex - 1; i >= 0; i--) {
                        if (this.tokenCrowdSaleStages[i]) {
                            if (this.tokenCrowdSaleStages[i].endDate) {
                                return moment(this.tokenCrowdSaleStages[i].endDate).add(10, 'm').toDate();
                            }
                            if (this.tokenCrowdSaleStages[i].startDate) {
                                return moment(this.tokenCrowdSaleStages[i].startDate).add(10, 'm').toDate();
                            }
                        }
                    }
                }
                return new Date();
            },
            getNotAfterStart(stageIndex) {
                if (this.tokenCrowdSaleStages[stageIndex].endDate) {
                    return moment(this.tokenCrowdSaleStages[stageIndex].endDate).subtract(10, 'm').toDate();
                } else {
                    for (let i = stageIndex + 1; i <= this.tokenCrowdSaleStages.length; i++) {
                        if (this.tokenCrowdSaleStages[i]) {
                            if (this.tokenCrowdSaleStages[i].startDate) {
                                return moment(this.tokenCrowdSaleStages[i].startDate).subtract(10, 'm').toDate();
                            }
                            if (this.tokenCrowdSaleStages[i].endDate) {
                                return moment(this.tokenCrowdSaleStages[i].endDate).subtract(10, 'm').toDate();
                            }
                        }
                    }
                    return false;
                }
            },
            getNotBeforeEnd(stageIndex) {
                if (this.tokenCrowdSaleStages[stageIndex].startDate) {
                    return moment(this.tokenCrowdSaleStages[stageIndex].startDate).add(10, 'm').toDate();
                } else {
                    for (let i = stageIndex - 1; i >= 0; i--) {
                        if (this.tokenCrowdSaleStages[i]) {
                            if (this.tokenCrowdSaleStages[i].endDate) {
                                return moment(this.tokenCrowdSaleStages[i].endDate).add(10, 'm').toDate();
                            }
                            if (this.tokenCrowdSaleStages[i].startDate) {
                                return moment(this.tokenCrowdSaleStages[i].startDate).add(10, 'm').toDate();
                            }

                        }
                    }
                    return new Date();
                }
            },
            getNotAfterEnd(stageIndex) {
                if (this.tokenCrowdSaleStages[stageIndex + 1]) {
                    for (let i = stageIndex + 1; i <= this.tokenCrowdSaleStages.length; i++) {
                        if (this.tokenCrowdSaleStages[i]) {
                            if (this.tokenCrowdSaleStages[i].startDate) {
                                return moment(this.tokenCrowdSaleStages[i].startDate).subtract(10, 'm').toDate();
                            }
                            if (this.tokenCrowdSaleStages[i].endDate) {
                                return moment(this.tokenCrowdSaleStages[i].endDate).subtract(10, 'm').toDate();
                            }
                        }
                    }
                }
                return false;
            },
            onMilestoneUpdateAtIndex(data, idx) {
                this.tokenCrowdSaleMilestones.splice(idx, 1, data);
                this.validateAndSetErrorsMilestone(data, idx);
            },
            resetMilestonesValidFlags() {
                this.$set(this, 'milestonesValidFlags', this.tokenCrowdSaleMilestones.map(() => ({tranchePercent: true})));
            },
            getMilestonesTotalTranchePercent() {
                return this.tokenCrowdSaleMilestones
                    .reduce(
                        (sum, item) => sum + parseInt(item.tranchePercent),
                        0
                    );
            },
            validateAndSetErrorsMilestone(data, idx) {
                const sum = this.tokenCrowdSaleMilestones
                    .filter((item, _idx) => _idx !== idx)
                    .reduce(
                        (sum, item) => sum + parseInt(item.tranchePercent),
                        parseInt(data.tranchePercent)
                    );
                this.resetMilestonesValidFlags();
                this.milestonesValidFlags[idx].tranchePercent = sum === 100;
            },
            validateMilestone(milestone) {
                return milestone.name
                    && milestone.description
                    && milestone.tranchePercent
                    && milestone.endDate
                    && milestone.withdrawalEndDate;
            }
        },
    };
</script>
