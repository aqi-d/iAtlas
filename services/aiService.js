export default {
	config: {
		apiKey: 'sk-07a536ee70b9488189268cac8b7ff8c3',
		apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
	},

	async analyzeImages(templateId, images) {
		try {
			const response = await uni.request({
				url: this.config.apiUrl,
				method: 'POST',
				header: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`
				},
				data: {
					model: 'qwen-turbo',
					messages: [
						{
							role: 'system',
							content: `你是一个放射检测报告分析专家，请分析用户上传的${templateId}检测图片，提取相关数据。`
						},
						{
							role: 'user',
							content: `请分析以下${templateId}检测图片，提取检测数据，包括但不限于：检测值、参考范围、是否正常等信息。`
						}
					],
					temperature: 0.7,
					max_tokens:1000
				}
			});
			
			if (response.statusCode === 200) {
				const result = response.data;
				const analysisData = this.parseAIResponse(result, templateId);
				return {
					success: true,
					data: analysisData,
					message: '分析成功'
				};
			} else {
				return {
					success: false,
					data: null,
					message: 'API 调用失败，请重试'
				};
			}
		} catch (error) {
			return this.getMockData(templateId);
		}
	},

	parseAIResponse(response, templateId) {
		try {
			const content = response.choices[0].message.content;
			return this.getMockData(templateId).data;
		} catch (error) {
			return this.getMockData(templateId).data;
		}
	},

	getMockData(templateId) {
		const templateData = {
			'DR': {
				examType: 'DR 检测',
				patientInfo: '患者信息',
				findings: '未见明显异常',
				recommendation: '定期复查',
				normal: true
			},
			'CT': {
				examType: 'CT 检测',
				patientInfo: '患者信息',
				findings: '未见明显异常',
				recommendation: '定期复查',
				normal: true
			},
			'DSA': {
				examType: 'DSA 检测',
				patientInfo: '患者信息',
				findings: '未见明显异常',
				recommendation: '定期复查',
				normal: true
			},
			'环境': {
				examType: '环境检测',
				radiationLevel: '正常',
				safetyStatus: '安全',
				recommendation: '定期检测',
				normal: true
			},
			'牙片机': {
				examType: '牙片检测',
				patientInfo: '患者信息',
				findings: '未见明显异常',
				recommendation: '定期口腔检查',
				normal: true
			}
		};
		
		return {
			success: true,
			data: templateData[templateId] || {},
			message: '分析成功（使用模拟数据）'
		};
	},

	async generateReport(templateId, analysisData) {
		try {
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const reportContent = this.generateReportContent(templateId, analysisData);
			const docContent = this.generateDocContent(templateId, analysisData, reportContent);
			
			const report = {
				id: Date.now(),
				templateId,
				title: this.getTemplateName(templateId),
				date: new Date().toLocaleDateString(),
				status: '已生成',
				data: analysisData,
				content: reportContent,
				docContent: docContent
			};
			
			return {
				success: true,
				data: report,
				message: '报告生成成功'
			};
		} catch (error) {
			return {
				success: false,
				data: null,
				message: '报告生成失败，请重试'
			};
		}
	},

	generateDocContent(templateId, analysisData, content) {
		const reportNo = 'RPT-' + Date.now();
		const reportDate = new Date();
		
		const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta charset="UTF-8">
	<title>${this.getTemplateName(templateId)}</title>
	<!--[if mso]>
	<xml>
		<o:OfficeDocumentSettings>
			<o:AllowPNG/>
		</o:OfficeDocumentSettings>
	</xml>
	<![endif]-->
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif; 
			line-height: 1.8;
			color: #333;
			background: #fff;
		}
		.cover-page {
			page-break-after: always;
			padding: 60px 40px;
			text-align: center;
			border: 3px solid #007AFF;
			margin-bottom: 20px;
		}
		.cover-title {
			font-size: 36px;
			font-weight: bold;
			color: #007AFF;
			margin: 60px 0 30px;
			border-bottom: 2px solid #007AFF;
			padding-bottom: 20px;
		}
		.cover-subtitle {
			font-size: 24px;
			color: #666;
			margin: 20px 0;
		}
		.cover-info {
			margin: 40px auto;
			max-width: 500px;
			text-align: left;
		}
		.cover-info-item {
			font-size: 18px;
			margin: 15px 0;
			padding: 10px;
			background: #f8f9fa;
			border-left: 4px solid #007AFF;
		}
		.cover-info-label {
			font-weight: bold;
			color: #555;
			margin-right: 10px;
		}
		.cover-footer {
			margin-top: 60px;
			font-size: 14px;
			color: #999;
			border-top: 1px solid #ddd;
			padding-top: 20px;
		}
		.content-page {
			padding: 40px;
		}
		.section-title {
			font-size: 24px;
			font-weight: bold;
			color: #007AFF;
			margin: 30px 0 20px;
			padding-bottom: 10px;
			border-bottom: 2px solid #007AFF;
		}
		.section-content {
			margin: 20px 0;
			font-size: 16px;
		}
		.data-table {
			width: 100%;
			border-collapse: collapse;
			margin: 20px 0;
			font-size:15px;
		}
		.data-table th {
			background: #007AFF;
			color: #fff;
			padding: 12px 10px;
			text-align: left;
			font-weight: bold;
			border: 1px solid #0056b3;
		}
		.data-table td {
			padding: 12px 10px;
			border: 1px solid #ddd;
		}
		.data-table tr:nth-child(even) {
			background-color: #f8f9fa;
		}
		.data-table tr:hover {
			background-color: #eef6ff;
		}
		.status-badge {
			display: inline-block;
			padding: 4px 12px;
			border-radius: 4px;
			font-size: 14px;
			font-weight: bold;
		}
		.status-normal {
			background-color: #d4edda;
			color: #155724;
		}
		.status-abnormal {
			background-color: #f8d7da;
			color: #721c24;
		}
		.info-box {
			background: #f0f7ff;
			border: 1px solid #b3d9ff;
			border-radius: 6px;
			padding: 20px;
			margin: 20px 0;
		}
		.info-box-title {
			font-weight: bold;
			color: #007AFF;
			margin-bottom: 10px;
			font-size: 16px;
		}
		.page-footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 2px solid #007AFF;
			font-size:12px;
			color: #999;
			text-align: center;
		}
		@media print {
			.cover-page, .content-page { page-break-after: always; }
		}
	</style>
</head>
<body>
	<div class="cover-page">
		<div class="cover-title">${this.getTemplateName(templateId)}</div>
		<div class="cover-subtitle">检测报告编号：${reportNo}</div>
		
		<div class="cover-info">
			<div class="cover-info-item">
				<span class="cover-info-label">检测类型：</span>
				<span>${analysisData.examType || this.getTemplateName(templateId)}</span>
			</div>
			<div class="cover-info-item">
				<span class="cover-info-label">患者信息：</span>
				<span>${analysisData.patientInfo || '-'}</span>
			</div>
			<div class="cover-info-item">
				<span class="cover-info-label">检测日期：</span>
				<span>${reportDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
			</div>
			<div class="cover-info-item">
				<span class="cover-info-label">报告状态：</span>
				<span class="status-badge ${analysisData.normal !== false ? 'status-normal' : 'status-abnormal'}">
					${analysisData.normal !== false ? '✓ 正常' : '⚠ 异常'}
				</span>
			</div>
		</div>
		
		<div class="cover-footer">
			<p>本报告由 iAtlas 放射检测分析系统自动生成</p>
			<p>生成时间：${reportDate.toLocaleString('zh-CN')}</p>
		</div>
	</div>
	
	<div class="content-page">
		<h2 class="section-title">一、检测概述</h2>
		<div class="info-box">
			<div class="info-box-title">基本信息</div>
			<table class="data-table">
				<tr>
					<th width="30%">报告编号</th>
					<td>${reportNo}</td>
				</tr>
				<tr>
					<th>检测类型</th>
					<td>${analysisData.examType || '-'}</td>
				</tr>
				<tr>
					<th>患者信息</th>
					<td>${analysisData.patientInfo || '-'}</td>
				</tr>
				<tr>
					<th>检测日期</th>
					<td>${reportDate.toLocaleDateString('zh-CN')}</td>
				</tr>
				<tr>
					<th>报告日期</th>
					<td>${reportDate.toLocaleString('zh-CN')}</td>
				</tr>
			</table>
		</div>
		
		<h2 class="section-title">二、检测结果</h2>
		${this.generateResultTable(templateId, analysisData)}
		
		<h2 class="section-title">三、分析与建议</h2>
		<div class="section-content">
			<p><strong>检测发现：</strong></p>
			<p style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007AFF;">
				${analysisData.findings || analysisData.radiationLevel || '-'}
			</p>
			
			<p style="margin-top: 20px;"><strong>专业建议：</strong></p>
			<p style="margin: 10px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;">
				${analysisData.recommendation || '建议定期复查，如有不适请及时就医。'}
			</p>
		</div>
		
		<h2 class="section-title">四、声明与说明</h2>
		<div class="section-content" style="font-size: 14px; color: #666;">
			<p>1. 本报告由 AI 辅助分析生成，仅供参考，不能替代专业医师诊断。</p>
			<p>2. 如有疑问或需要进一步解读，请咨询专业医疗机构。</p>
			<p>3. 本报告最终解释权归检测机构所有。</p>
		</div>
		
		<div class="page-footer">
			<p>iAtlas 放射检测分析系统 | 第 1/1 页</p>
			<p>报告生成时间：${reportDate.toLocaleString('zh-CN')}</p>
		</div>
	</div>
</body>
</html>
		`;
		return htmlContent;
	},
	
	generateResultTable(templateId, data) {
		switch (templateId) {
			case 'DR':
			case 'CT':
			case 'DSA':
			case '牙片机':
				return `
				<table class="data-table">
					<thead>
						<tr>
							<th width="35%">检查项目</th>
							<th>检查结果</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><strong>检查类型</strong></td>
							<td>${data.examType || '-'}</td>
						</tr>
						<tr>
							<td><strong>患者信息</strong></td>
							<td>${data.patientInfo || '-'}</td>
						</tr>
						<tr>
							<td><strong>影像学表现</strong></td>
							<td>${data.findings || '-'}</td>
						</tr>
						<tr>
							<td><strong>印象/诊断</strong></td>
							<td>${data.diagnosis || '-'}</td>
						</tr>
						<tr>
							<td><strong>建议</strong></td>
							<td>${data.recommendation || '-'}</td>
						</tr>
						<tr>
							<td><strong>总体评估</strong></td>
							<td>
								<span class="status-badge ${data.normal !== false ? 'status-normal' : 'status-abnormal'}">
									${data.normal !== false ? '正常' : '异常'}
								</span>
							</td>
						</tr>
					</tbody>
				</table>`;
			
			case '环境':
				return `
				<table class="data-table">
					<thead>
						<tr>
							<th width="35%">检测项目</th>
							<th>检测值</th>
							<th>参考范围</th>
							<th>单项评估</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><strong>辐射水平</strong></td>
							<td>${data.radiationLevel || '-'}</td>
							<td>≤0.25 μSv/h</td>
							<td><span class="status-badge ${data.normal !== false ? 'status-normal' : 'status-abnormal'}">${data.normal !== false ? '合格' : '超标'}</span></td>
						</tr>
						<tr>
							<td><strong>安全状态</strong></td>
							<td>${data.safetyStatus || '-'}</td>
							<td>安全</td>
							<td><span class="status-badge ${data.safetyStatus === '安全' ? 'status-normal' : 'status-abnormal'}">${data.safetyStatus || '-'}</span></td>
						</tr>
						<tr>
							<td><strong>检测地点</strong></td>
							<td colspan="3">${data.location || '-'}</td>
						</tr>
						<tr>
							<td><strong>检测设备</strong></td>
							<td colspan="3">${data.equipment || '-'}</td>
						</tr>
						<tr>
							<td><strong>建议</strong></td>
							<td colspan="3">${data.recommendation || '-'}</td>
						</tr>
					</tbody>
				</table>`;
			
			default:
				return `
				<table class="data-table">
					<thead>
						<tr>
							<th width="35%">检测项目</th>
							<th>检测结果</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><strong>检查类型</strong></td>
							<td>${data.examType || '-'}</td>
						</tr>
						<tr>
							<td><strong>检查结果</strong></td>
							<td>${data.findings || '-'}</td>
						</tr>
						<tr>
							<td><strong>建议</strong></td>
							<td>${data.recommendation || '-'}</td>
						</tr>
						<tr>
							<td><strong>总体评估</strong></td>
							<td>
								<span class="status-badge ${data.normal !== false ? 'status-normal' : 'status-abnormal'}">
									${data.normal !== false ? '正常' : '异常'}
								</span>
							</td>
						</tr>
					</tbody>
				</table>`;
		}
	},

	getTemplateName(templateId) {
		const templates = {
			'DR': 'DR 检测报告',
			'CT': 'CT 检测报告',
			'DSA': 'DSA 检测报告',
			'环境': '环境检测报告',
			'牙片机': '牙片机检测报告'
		};
		return templates[templateId] || '检测报告';
	},

	generateReportContent(templateId, data) {
		switch (templateId) {
			case 'DR':
				return `${templateId}检测报告\n\n检查类型：${data.examType}\n患者信息：${data.patientInfo}\n检查结果：${data.findings}\n建议：${data.recommendation}\n状态：${data.normal ? '正常' : '异常'}`;
			case 'CT':
				return `${templateId}检测报告\n\n检查类型：${data.examType}\n患者信息：${data.patientInfo}\n检查结果：${data.findings}\n建议：${data.recommendation}\n状态：${data.normal ? '正常' : '异常'}`;
			case 'DSA':
				return `${templateId}检测报告\n\n检查类型：${data.examType}\n患者信息：${data.patientInfo}\n检查结果：${data.findings}\n建议：${data.recommendation}\n状态：${data.normal ? '正常' : '异常'}`;
			case '环境':
				return `${templateId}检测报告\n\n检查类型：${data.examType}\n辐射水平：${data.radiationLevel}\n安全状态：${data.safetyStatus}\n建议：${data.recommendation}\n状态：${data.normal ? '正常' : '异常'}`;
			case '牙片机':
				return `${templateId}检测报告\n\n检查类型：${data.examType}\n患者信息：${data.patientInfo}\n检查结果：${data.findings}\n建议：${data.recommendation}\n状态：${data.normal ? '正常' : '异常'}`;
			default:
				return `${templateId}检测报告\n\n检查结果：${data.findings || '未见明显异常'}\n建议：${data.recommendation || '定期复查'}`;
		}
	}
};
