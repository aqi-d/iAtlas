<template>
	<view class="container">
		<view class="section">
			<text class="section-title">选择报告模板</text>
			<view class="template-select">
				<picker @change="bindTemplateChange" :value="templateIndex" :range="templates">
					<view class="picker-view">
						{{ selectedTemplate || '请选择报告模板' }}
					</view>
				</picker>
			</view>
		</view>

		<view class="section">
			<text class="section-title">上传检测图片</text>
			<view class="upload-area">
				<view class="upload-btn" @click="chooseImage">
					<text class="upload-icon">+</text>
					<text class="upload-text">点击上传图片</text>
				</view>
				<view class="image-list">
					<view v-for="(image, index) in images" :key="index" class="image-item">
						<image :src="image" mode="aspectFill" class="image"></image>
						<view class="image-delete" @click="deleteImage(index)">
							<text>×</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="button-area">
			<button 
				class="analyze-btn"
				:disabled="!selectedTemplate || images.length === 0"
				@click="analyzeImages"
			>
				AI分析图片
			</button>
		</view>
	</view>
</template>

<script>
import aiService from '../../services/aiService.js';

export default {
	data() {
		return {
			templates: ['DR', 'CT', 'DSA', '环境', '牙片机'],
			templateIndex: 0,
			selectedTemplate: '',
			images: []
		}
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
			uni.chooseImage({
				count: 9,
				sizeType: ['original', 'compressed'],
				sourceType: ['album', 'camera'],
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
				uni.showToast({ 
					title: '请选择报告模板', 
					icon: 'none' 
				});
				return;
			}
			
			if (this.images.length === 0) {
				uni.showToast({ 
					title: '请上传检测图片', 
					icon: 'none' 
				});
				return;
			}
			
			uni.showLoading({ title: 'AI分析中...' });
			
			try {
				// 调用AI服务分析图片
				const analysisResult = await aiService.analyzeImages(this.selectedTemplate, this.images);
				
				if (analysisResult.success) {
					uni.hideLoading();
					uni.showToast({ 
						title: '分析完成，报告生成中', 
						icon: 'success' 
					});
					
					// 生成报告
					const reportResult = await aiService.generateReport(this.selectedTemplate, analysisResult.data);
					
					if (reportResult.success) {
						// 存储报告到uniCloud
						uni.showLoading({ title: '存储报告中...' });
						
						uniCloud.callFunction({
							name: 'report-manager',
							data: {
								action: 'saveReport',
								report: reportResult.data
							}
						}).then(res => {
							uni.hideLoading();
							console.log('云函数返回结果:', res);
							if (res.result.success) {
								uni.showToast({ 
									title: '报告生成成功', 
									icon: 'success' 
								});
							} else {
								console.error('存储报告失败:', res.result.message);
								uni.showToast({ 
									title: '存储报告失败: ' + res.result.message, 
									icon: 'none' 
								});
							}
						}).catch(error => {
							uni.hideLoading();
							console.error('云存储失败:', error);
							uni.showToast({ 
								title: '存储报告失败: ' + error.message, 
								icon: 'none' 
							});
						});
					} else {
						uni.hideLoading();
						uni.showToast({ 
							title: reportResult.message, 
							icon: 'none' 
						});
					}
				} else {
					uni.hideLoading();
					uni.showToast({ 
						title: analysisResult.message, 
						icon: 'none' 
					});
				}
			} catch (error) {
				uni.hideLoading();
				uni.showToast({ 
					title: '分析失败，请重试', 
					icon: 'none' 
				});
				console.error('分析失败:', error);
			}
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

.section {
	background-color: #fff;
	border-radius: 12rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.template-select {
	margin-top: 10rpx;
}

.picker-view {
	width: 100%;
	height: 80rpx;
	background-color: #f5f5f5;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #333;
	border: 2rpx solid #e0e0e0;
	box-sizing: border-box;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.upload-area {
	margin-top: 10rpx;
}

.upload-btn {
	width: 100%;
	height: 200rpx;
	border: 2rpx dashed #e0e0e0;
	border-radius: 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background-color: #f9f9f9;
}

.upload-icon {
	font-size: 60rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.upload-text {
	font-size: 24rpx;
	color: #999;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
	margin-top: 20rpx;
}

.image-item {
	width: 150rpx;
	height: 150rpx;
	position: relative;
}

.image {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}

.image-delete {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 36rpx;
	height: 36rpx;
	background-color: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 24rpx;
	cursor: pointer;
}

.button-area {
	margin-top: 40rpx;
	padding-bottom: 100rpx;
}

.analyze-btn {
	width: 100%;
	height: 90rpx;
	background-color: #007AFF;
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
	transition: all 0.3s ease;
}

</style>