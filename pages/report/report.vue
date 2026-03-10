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
        :key="report._id" 
        class="report-item"
        @click="showReportDetail(report)" 
      >
        <view class="report-header">
          <text class="report-title">{{ report.title }}</text>
          <text class="report-status">{{ report.status }}</text>
        </view>
        
        <view class="report-info">
          <text class="report-date">日期：{{ report.date }}</text>
          <text class="report-patient" v-if="report.data && report.data.patientInfo">
            患者：{{ report.data.patientInfo }}
          </text>
        </view>

        <view class="report-footer">
          <text class="report-action download-btn" @click.stop="downloadReport(report)">
            📥 下载报告
          </text>
          <text class="report-delete" @click.stop="deleteReport(report._id)">
            删除
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      reports: [],
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
      uni.showLoading({ title: "加载中..." });
      uniCloud
        .callFunction({
          name: "report-manager",
          data: { action: "getReports" },
          config: {
            spaceId: 'mp-fa2d4671-a5b6-4b91-ad1f-2424e84a69b4'
          }
        })
        .then((res) => {
          uni.hideLoading();
         if (res.result.success) {
            this.reports = res.result.data || [];
          } else {
            uni.showToast({ title: "获取失败", icon: "none" });
          }
        })
        .catch((err) => {
          uni.hideLoading();
          uni.showToast({ title: "网络错误", icon: "none" });
        });
    },

    showReportDetail(report) {
      const data = report.data || {};
      const contentLines = [
        `检查类型：${data.examType || '-'}`,
        `患者信息：${data.patientInfo || '-'}`,
        `检查结果：${data.findings || '-'}`,
        `建议：${data.recommendation || '-'}`,
        `状态：${report.status || '-'}`
      ];

      uni.showModal({
        title: report.title,
        content: contentLines.join('\n'),
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#007AFF'
      });
    },

    downloadReport(report) {
     if (!report.fileUrl) {
        uni.showToast({
          title: '该报告暂无附件',
          icon: 'none'
        });
        return;
      }

      uni.showLoading({ title: '正在下载...' });

      uni.downloadFile({
        url: report.fileUrl,
       fileType: 'document',
        success: (downloadRes) => {
         if (downloadRes.statusCode === 200) {
            const tempFilePath = downloadRes.tempFilePath;
            
            uni.openDocument({
             filePath: tempFilePath,
             fileName: report.fileName || '检测报告.docx',
              showMenu: true,
              success: () => {
                uni.hideLoading();
                uni.showToast({ title: '已启动预览', icon: 'success' });
              },
              fail: (openErr) => {
                uni.hideLoading();
                
                try {
                  const sysInfo = uni.getSystemInfoSync();
                 if (sysInfo.appName === 'h5') {
                     this.openInBrowser(report.fileUrl, report.fileName);
                     return;
                  }
                } catch (e) {
                }

                uni.showModal({
                  title: '预览失败',
                  content: '无法调用系统预览，请检查是否安装 WPS/Office，或去文件管理查看。',
                  showCancel: false
                });
              }
            });
          } else {
            uni.hideLoading();
            uni.showToast({ title: `下载失败 (${downloadRes.statusCode})`, icon: 'none' });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          
         if (err.errMsg && err.errMsg.includes('url not in domain list')) {
             uni.showModal({
               title: '域名未配置',
               content: '请在小程序后台将文件域名加入 downloadFile 合法域名列表。\n\n临时解决方案：\n在开发者工具中勾选"不校验合法域名"',
               showCancel: false
             });
          } else if (err.errMsg && err.errMsg.includes('timeout')) {
             uni.showModal({
               title: '网络超时',
               content: '下载超时，请检查网络连接或重试。',
               showCancel: false
             });
          } else {
             uni.showModal({
               title: '下载失败',
               content: err.errMsg || '网络异常，请重试',
               showCancel: false
             });
          }
        }
      });
    },

    openInBrowser(url, fileName) {
      uni.showModal({
        title: '提示',
        content: '浏览器环境将尝试在新标签页打开文件，若未自动下载请点击浏览器菜单保存。',
        success: (res) => {
         if (res.confirm) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'report.docx';
            a.target = '_blank';
            document.body.appendChild(a);
           a.click();
            document.body.removeChild(a);
          }
        }
      });
    },

    deleteReport(reportId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这份报告吗？此操作不可恢复。',
        confirmColor: '#ff3b30',
        success: (res) => {
         if (res.confirm) {
            uni.showLoading({ title: '删除中...' });
            uniCloud
              .callFunction({
                name: "report-manager",
                data: { action: "deleteReport", reportId: reportId },
              })
              .then((res) => {
                uni.hideLoading();
               if (res.result.success) {
                  uni.showToast({ title: '删除成功', icon: 'success' });
                  this.loadReports();
                } else {
                  uni.showToast({ title: res.result.message, icon: 'none' });
                }
              })
              .catch((err) => {
                uni.hideLoading();
                uni.showToast({ title: '删除失败', icon: 'none' });
              });
          }
        },
      });
    },
  },
};
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
  height: 60vh;
  color: #999;
}
.empty-icon { font-size: 100rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 30rpx; margin-bottom: 10rpx; color: #666; }

.report-list { display: flex; flex-direction: column; gap: 20rpx; }

.report-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  position: relative;
}
.report-item:active { background-color: #fafafa; }

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}
.report-title { font-size: 30rpx; font-weight: bold; color: #333; }
.report-status {
  font-size: 22rpx;
  color: #007aff;
  background: #eef6ff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.report-info {
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.report-date, .report-patient { font-size: 24rpx; color: #666; }

.report-footer {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-action.download-btn {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 500;
  padding: 10rpx 20rpx;
  background-color: #f0f8ff;
  border-radius: 8rpx;
}

.report-delete {
  font-size: 26rpx;
  color: #ff3b30;
  padding: 10rpx 20rpx;
}
</style>
