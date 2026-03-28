"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepaymentType = exports.RepaymentMethod = void 0;
// 还款方式
var RepaymentMethod;
(function (RepaymentMethod) {
    RepaymentMethod["EQUAL_INSTALLMENT"] = "equal_installment";
    RepaymentMethod["EQUAL_PRINCIPAL"] = "equal_principal";
})(RepaymentMethod || (exports.RepaymentMethod = RepaymentMethod = {}));
// 提前还款类型
var PrepaymentType;
(function (PrepaymentType) {
    PrepaymentType["REDUCE_TERM"] = "reduce_term";
    PrepaymentType["REDUCE_PAYMENT"] = "reduce_payment";
})(PrepaymentType || (exports.PrepaymentType = PrepaymentType = {}));
//# sourceMappingURL=types.js.map