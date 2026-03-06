<template>
	<view class="container">
		<view v-if="reports.length === 0" class="empty-state">
			<text class="empty-icon">📄</text>
			<text class="empty-text">暂无报告</text>
			<text class="empty-desc">请先在模板选择页面生成报告</text>
		</view>
		<view v-else class="report-list">
			<view 
				v-for="(report, index) in reports" 
				:key="report.id"
				class="report-item"
				@click="viewReport(report)"
			>
				<view class="report-header">
					<text class="report-title">{{ report.title }}</text>
					<text class="report-status">{{ report.status }}</text>
				</view>
				<view class="report-info">
					<text class="report-date">生成日期：{{ report.date }}</text>
				</view>
				<view class="report-footer">
					<text class="report-action" @click="viewReport(report)">查看详情</text>
					<text class="report-delete" @click.stop="deleteReport(report.id)">删除</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			reports: []
		}
	},
	onLoad() {
		this.loadReports();
	},
	onShow() {
		this.loadReports();
	},
	methods: {
		loadReports() {
			// 从uniCloud获取报告列表
			uni.showLoading({ title: '加载报告中...' });
			
			uniCloud.callFunction({
				name: 'report-manager',
				data: {
					action: 'getReports'
				}
			}).then(res => {
				uni.hideLoading();
				if (res.result.success) {
					this.reports = res.result.data;
				} else {
					this.reports = [];
					uni.showToast({ 
						title: '获取报告失败', 
						icon: 'none' 
					});
				}
			}).catch(error => {
				uni.hideLoading();
				console.error('从云获取报告失败:', error);
				this.reports = [];
				uni.showToast({ 
					title: '获取报告失败', 
					icon: 'none' 
				});
			});
		},
		viewReport(report) {
			// 检查是否有docContent
			if (report.docContent) {
				// 创建临时文件并打开
				uni.showLoading({ title: '打开报告中...' });
				
				// 将HTML内容转换为Base64
				const base64Content = uni.arrayBufferToBase64(new TextEncoder().encode(report.docContent));
				const filePath = `${wx.env.USER_DATA_PATH}/${report.id}.html`;
				
				// 写入文件
				uni.writeFile({
					filePath: filePath,
					data: base64Content,
					encoding: 'base64',
					success: function(res) {
						uni.hideLoading();
						// 打开文档
						uni.openDocument({
							filePath: filePath,
							showMenu: true,
							success: function(res) {
								console.log('打开文档成功');
							},
							fail: function(error) {
								console.error('打开文档失败:', error);
								// 失败时使用模态框显示
								uni.showModal({
									title: report.title,
									content: report.content || `生成日期：${report.date}\n状态：${report.status}\n\n报告详情将在此处展示`,
									showCancel: false
								});
							}
						});
					},
					fail: function(error) {
						uni.hideLoading();
						console.error('写入文件失败:', error);
						// 失败时使用模态框显示
						uni.showModal({
							title: report.title,
							content: report.content || `生成日期：${report.date}\n状态：${report.status}\n\n报告详情将在此处展示`,
							showCancel: false
						});
					}
				});
			} else {
				// 没有docContent时使用模态框显示
				uni.showModal({
					title: report.title,
					content: report.content || `生成日期：${report.date}\n状态：${report.status}\n\n报告详情将在此处展示`,
					showCancel: false
				});
			}
		},
		deleteReport(reportId) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这份报告吗？',
				confirmText: '删除',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '删除报告中...' });
						
						// 从uniCloud删除报告
						uniCloud.callFunction({
							name: 'report-manager',
							data: {
								action: 'deleteReport',
								reportId: reportId
							}
						}).then(res => {
							uni.hideLoading();
							if (res.result.success) {
								uni.showToast({ 
									title: '删除成功', 
									icon: 'success' 
								});
								// 重新加载报告列表
								this.loadReports();
							} else {
								uni.showToast({ 
									title: '删除失败', 
									icon: 'none' 
								});
							}
						}).catch(error => {
							uni.hideLoading();
							console.error('云删除失败:', error);
							uni.showToast({ 
								title: '删除失败', 
								icon: 'none' 
							});
						});
					}
				}
			});
		}
	}
}
</script>

<style scoped>
.container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 80vh;
	text-align: center;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 15rpx;
}

.empty-desc {
	font-size: 24rpx;
	color: #999;
}

.report-list {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.report-item {
	background-color: #fff;
	border-radius: 12rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	cursor: pointer;
	transition: all 0.3s;
}

.report-item:active {
	transform: scale(0.98);
}

.report-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.report-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	flex: 1;
}

.report-status {
	font-size: 20rpx;
	color: #007AFF;
	background-color: #f0f8ff;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.report-info {
	margin-bottom: 20rpx;
}

.report-date {
	font-size: 24rpx;
	color: #666;
}

.report-footer {
	border-top: 1rpx solid #f0f0f0;
	padding-top: 15rpx;
	display: flex;
	justify-content: flex-end;
}

.report-footer {
	border-top: 1rpx solid #f0f0f0;
	padding-top: 15rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.report-action {
	font-size: 24rpx;
	color: #007AFF;
}

.report-delete {
	font-size: 24rpx;
	color: #ff3b30;
}
</style>