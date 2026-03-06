"use strict";
const common_vendor = require("../../common/vendor.js");
const services_aiService = require("../../services/aiService.js");
const _sfc_main = {
  data() {
    return {
      templates: ["DR", "CT", "DSA", "环境", "牙片机"],
      templateIndex: 0,
      selectedTemplate: "",
      images: []
    };
  },
  methods: {
    bindTemplateChange(e) {
      this.templateIndex = e.detail.value;
      this.selectedTemplate = this.templates[this.templateIndex];
    },
    selectTemplate(templateId) {
      this.selectedTemplate = templateId;
    },
    chooseImage() {
      common_vendor.index.chooseImage({
        count: 9,
        sizeType: ["original", "compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.images = this.images.concat(res.tempFilePaths);
        }
      });
    },
    deleteImage(index) {
      this.images.splice(index, 1);
    },
    async analyzeImages() {
      if (!this.selectedTemplate) {
        common_vendor.index.showToast({
          title: "请选择报告模板",
          icon: "none"
        });
        return;
      }
      if (this.images.length === 0) {
        common_vendor.index.showToast({
          title: "请上传检测图片",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({ title: "AI分析中..." });
      try {
        const analysisResult = await services_aiService.aiService.analyzeImages(this.selectedTemplate, this.images);
        if (analysisResult.success) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "分析完成，报告生成中",
            icon: "success"
          });
          const reportResult = await services_aiService.aiService.generateReport(this.selectedTemplate, analysisResult.data);
          if (reportResult.success) {
            common_vendor.index.showLoading({ title: "存储报告中..." });
            common_vendor.tr.callFunction({
              name: "report-manager",
              data: {
                action: "saveReport",
                report: reportResult.data
              }
            }).then((res) => {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("log", "at pages/home/home.vue:122", "云函数返回结果:", res);
              if (res.result.success) {
                common_vendor.index.showToast({
                  title: "报告生成成功",
                  icon: "success"
                });
              } else {
                common_vendor.index.__f__("error", "at pages/home/home.vue:129", "存储报告失败:", res.result.message);
                common_vendor.index.showToast({
                  title: "存储报告失败: " + res.result.message,
                  icon: "none"
                });
              }
            }).catch((error) => {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/home/home.vue:137", "云存储失败:", error);
              common_vendor.index.showToast({
                title: "存储报告失败: " + error.message,
                icon: "none"
              });
            });
          } else {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: reportResult.message,
              icon: "none"
            });
          }
        } else {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: analysisResult.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "分析失败，请重试",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/home/home.vue:163", "分析失败:", error);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.selectedTemplate || "请选择报告模板"),
    b: common_vendor.o((...args) => $options.bindTemplateChange && $options.bindTemplateChange(...args)),
    c: $data.templateIndex,
    d: $data.templates,
    e: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args)),
    f: common_vendor.f($data.images, (image, index, i0) => {
      return {
        a: image,
        b: common_vendor.o(($event) => $options.deleteImage(index), index),
        c: index
      };
    }),
    g: !$data.selectedTemplate || $data.images.length === 0,
    h: common_vendor.o((...args) => $options.analyzeImages && $options.analyzeImages(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
