"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      reports: []
    };
  },
  onLoad() {
    this.loadReports();
  },
  onShow() {
    this.loadReports();
  },
  methods: {
    loadReports() {
      common_vendor.index.showLoading({ title: "加载报告中..." });
      common_vendor.tr.callFunction({
        name: "report-manager",
        data: {
          action: "getReports"
        }
      }).then((res) => {
        common_vendor.index.hideLoading();
        if (res.result.success) {
          this.reports = res.result.data;
        } else {
          this.reports = [];
          common_vendor.index.showToast({
            title: "获取报告失败",
            icon: "none"
          });
        }
      }).catch((error) => {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/report/report.vue:67", "从云获取报告失败:", error);
        this.reports = [];
        common_vendor.index.showToast({
          title: "获取报告失败",
          icon: "none"
        });
      });
    },
    viewReport(report) {
      if (report.docContent) {
        common_vendor.index.showLoading({ title: "打开报告中..." });
        const base64Content = common_vendor.index.arrayBufferToBase64(new TextEncoder().encode(report.docContent));
        const filePath = `${common_vendor.wx$1.env.USER_DATA_PATH}/${report.id}.html`;
        common_vendor.index.writeFile({
          filePath,
          data: base64Content,
          encoding: "base64",
          success: function(res) {
            common_vendor.index.hideLoading();
            common_vendor.index.openDocument({
              filePath,
              showMenu: true,
              success: function(res2) {
                common_vendor.index.__f__("log", "at pages/report/report.vue:97", "打开文档成功");
              },
              fail: function(error) {
                common_vendor.index.__f__("error", "at pages/report/report.vue:100", "打开文档失败:", error);
                common_vendor.index.showModal({
                  title: report.title,
                  content: report.content || `生成日期：${report.date}
状态：${report.status}

报告详情将在此处展示`,
                  showCancel: false
                });
              }
            });
          },
          fail: function(error) {
            common_vendor.index.hideLoading();
            common_vendor.index.__f__("error", "at pages/report/report.vue:112", "写入文件失败:", error);
            common_vendor.index.showModal({
              title: report.title,
              content: report.content || `生成日期：${report.date}
状态：${report.status}

报告详情将在此处展示`,
              showCancel: false
            });
          }
        });
      } else {
        common_vendor.index.showModal({
          title: report.title,
          content: report.content || `生成日期：${report.date}
状态：${report.status}

报告详情将在此处展示`,
          showCancel: false
        });
      }
    },
    deleteReport(reportId) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这份报告吗？",
        confirmText: "删除",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "删除报告中..." });
            common_vendor.tr.callFunction({
              name: "report-manager",
              data: {
                action: "deleteReport",
                reportId
              }
            }).then((res2) => {
              common_vendor.index.hideLoading();
              if (res2.result.success) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                this.loadReports();
              } else {
                common_vendor.index.showToast({
                  title: "删除失败",
                  icon: "none"
                });
              }
            }).catch((error) => {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/report/report.vue:164", "云删除失败:", error);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none"
              });
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.reports.length === 0
  }, $data.reports.length === 0 ? {} : {
    b: common_vendor.f($data.reports, (report, index, i0) => {
      return {
        a: common_vendor.t(report.title),
        b: common_vendor.t(report.status),
        c: common_vendor.t(report.date),
        d: common_vendor.o(($event) => $options.viewReport(report), report.id),
        e: common_vendor.o(($event) => $options.deleteReport(report.id), report.id),
        f: report.id,
        g: common_vendor.o(($event) => $options.viewReport(report), report.id)
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-12a8021c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/report/report.js.map
