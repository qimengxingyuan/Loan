"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepaymentType = exports.RepaymentMethod = void 0;
// 还款方式
var RepaymentMethod;
(function (RepaymentMethod) {
    RepaymentMethod["EQUAL_INSTALLMENT"] = "equal_installment";
    RepaymentMethod["EQUAL_PRINCIPAL"] = "equal_principal";
    RepaymentMethod["EQUAL_PRINCIPAL_INTEREST"] = "equal_principal_interest";
    RepaymentMethod["FREE_REPAYMENT"] = "free_repayment";
})(RepaymentMethod || (exports.RepaymentMethod = RepaymentMethod = {}));
// 提前还款类型
exports.PrepaymentType = {
    REDUCE_TERM: 'reduce_term',
    REDUCE_PAYMENT: 'reduce_payment'
};
//# sourceMappingURL=types.js.map