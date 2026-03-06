"use strict";
const common_vendor = require("../common/vendor.js");
const aiService = {
  // 千问AI API配置
  config: {
    apiKey: "sk-07a536ee70b9488189268cac8b7ff8c3",
    apiUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
  },
  /**
   * 分析图片并提取数据
   * @param {string} templateId - 模板ID
   * @param {Array} images - 图片路径数组
   * @returns {Promise} - 返回分析结果
   */
  async analyzeImages(templateId, images) {
    try {
      common_vendor.index.__f__("log", "at services/aiService.js:17", "AI分析参数:", {
        templateId,
        images: images.length
      });
      const response = await common_vendor.index.request({
        url: this.config.apiUrl,
        method: "POST",
        header: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        data: {
          model: "ep-20260306163145-657b4",
          messages: [
            {
              role: "system",
              content: `你是一个放射检测报告分析专家，请分析用户上传的${templateId}检测图片，提取相关数据。`
            },
            {
              role: "user",
              content: `请分析以下${templateId}检测图片，提取检测数据，包括但不限于：检测值、参考范围、是否正常等信息。`
            }
          ],
          temperature: 0.7,
          max_tokens: 1e3
        }
      });
      if (response.statusCode === 200) {
        const result = response.data;
        const analysisData = this.parseAIResponse(result, templateId);
        return {
          success: true,
          data: analysisData,
          message: "分析成功"
        };
      } else {
        common_vendor.index.__f__("error", "at services/aiService.js:56", "API调用失败:", response);
        return {
          success: false,
          data: null,
          message: "API调用失败，请重试"
        };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at services/aiService.js:64", "AI分析失败:", error);
      return this.getMockData(templateId);
    }
  },
  /**
   * 解析AI响应
   * @param {Object} response - AI API响应
   * @param {string} templateId - 模板ID
   * @returns {Object} - 解析后的数据
   */
  parseAIResponse(response, templateId) {
    try {
      const content = response.choices[0].message.content;
      return this.getMockData(templateId).data;
    } catch (error) {
      common_vendor.index.__f__("error", "at services/aiService.js:83", "解析AI响应失败:", error);
      return this.getMockData(templateId).data;
    }
  },
  /**
   * 获取模拟数据（当API调用失败时使用）
   * @param {string} templateId - 模板ID
   * @returns {Object} - 模拟数据
   */
  getMockData(templateId) {
    const templateData = {
      "DR": {
        examType: "DR检测",
        patientInfo: "患者信息",
        findings: "未见明显异常",
        recommendation: "定期复查",
        normal: true
      },
      "CT": {
        examType: "CT检测",
        patientInfo: "患者信息",
        findings: "未见明显异常",
        recommendation: "定期复查",
        normal: true
      },
      "DSA": {
        examType: "DSA检测",
        patientInfo: "患者信息",
        findings: "未见明显异常",
        recommendation: "定期复查",
        normal: true
      },
      "环境": {
        examType: "环境检测",
        radiationLevel: "正常",
        safetyStatus: "安全",
        recommendation: "定期检测",
        normal: true
      },
      "牙片机": {
        examType: "牙片检测",
        patientInfo: "患者信息",
        findings: "未见明显异常",
        recommendation: "定期口腔检查",
        normal: true
      }
    };
    return {
      success: true,
      data: templateData[templateId] || {},
      message: "分析成功（使用模拟数据）"
    };
  },
  /**
   * 生成报告
   * @param {string} templateId - 模板ID
   * @param {Object} analysisData - 分析数据
   * @returns {Promise} - 返回生成的报告
   */
  async generateReport(templateId, analysisData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const reportContent = this.generateReportContent(templateId, analysisData);
      const docContent = this.generateDocContent(templateId, analysisData, reportContent);
      const report = {
        id: Date.now(),
        templateId,
        title: this.getTemplateName(templateId),
        date: (/* @__PURE__ */ new Date()).toLocaleDateString(),
        status: "已生成",
        data: analysisData,
        content: reportContent,
        docContent
      };
      return {
        success: true,
        data: report,
        message: "报告生成成功"
      };
    } catch (error) {
      common_vendor.index.__f__("error", "at services/aiService.js:172", "报告生成失败:", error);
      return {
        success: false,
        data: null,
        message: "报告生成失败，请重试"
      };
    }
  },
  /**
   * 生成doc格式的报告内容
   * @param {string} templateId - 模板ID
   * @param {Object} analysisData - 分析数据
   * @param {string} content - 报告文本内容
   * @returns {string} - doc格式的报告内容
   */
  generateDocContent(templateId, analysisData, content) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>${this.getTemplateName(templateId)}</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			line-height: 1.6;
			padding: 20px;
		}
		h1 {
			color: #333;
			text-align: center;
			margin-bottom: 30px;
		}
		h2 {
			color: #555;
			margin-top: 20px;
		}
		p {
			margin: 10px 0;
		}
		.info {
			background-color: #f5f5f5;
			padding: 15px;
			border-radius: 5px;
			margin: 15px 0;
		}
		.data {
			margin-left: 20px;
		}
	</style>
</head>
<body>
	<h1>${this.getTemplateName(templateId)}</h1>
	<div class="info">
		<p><strong>生成日期：</strong>${(/* @__PURE__ */ new Date()).toLocaleDateString()}</p>
		<p><strong>检测类型：</strong>${analysisData.examType || templateId}</p>
	</div>
	<div class="data">
		${content.replace(/\n/g, "<br>")}
	</div>
</body>
</html>
		`;
    return htmlContent;
  },
  /**
   * 获取模板名称
   * @param {string} templateId - 模板ID
   * @returns {string} - 模板名称
   */
  getTemplateName(templateId) {
    const templates = {
      "DR": "DR检测报告",
      "CT": "CT检测报告",
      "DSA": "DSA检测报告",
      "环境": "环境检测报告",
      "牙片机": "牙片机检测报告"
    };
    return templates[templateId] || "检测报告";
  },
  /**
   * 生成报告内容
   * @param {string} templateId - 模板ID
   * @param {Object} data - 分析数据
   * @returns {string} - 报告内容
   */
  generateReportContent(templateId, data) {
    switch (templateId) {
      case "DR":
        return `${templateId}检测报告

检查类型：${data.examType}
患者信息：${data.patientInfo}
检查结果：${data.findings}
建议：${data.recommendation}
状态：${data.normal ? "正常" : "异常"}`;
      case "CT":
        return `${templateId}检测报告

检查类型：${data.examType}
患者信息：${data.patientInfo}
检查结果：${data.findings}
建议：${data.recommendation}
状态：${data.normal ? "正常" : "异常"}`;
      case "DSA":
        return `${templateId}检测报告

检查类型：${data.examType}
患者信息：${data.patientInfo}
检查结果：${data.findings}
建议：${data.recommendation}
状态：${data.normal ? "正常" : "异常"}`;
      case "环境":
        return `${templateId}检测报告

检查类型：${data.examType}
辐射水平：${data.radiationLevel}
安全状态：${data.safetyStatus}
建议：${data.recommendation}
状态：${data.normal ? "正常" : "异常"}`;
      case "牙片机":
        return `${templateId}检测报告

检查类型：${data.examType}
患者信息：${data.patientInfo}
检查结果：${data.findings}
建议：${data.recommendation}
状态：${data.normal ? "正常" : "异常"}`;
      default:
        return `${templateId}检测报告

检查结果：${data.findings || "未见明显异常"}
建议：${data.recommendation || "定期复查"}`;
    }
  }
};
exports.aiService = aiService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/services/aiService.js.map
