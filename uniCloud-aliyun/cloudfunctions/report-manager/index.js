// 报告管理云函数
const db = uniCloud.database();
// 定义集合名称，确保这里和数据库里的一致
const REPORT_COLLECTION_NAME = 'reports';
const reportCollection = db.collection(REPORT_COLLECTION_NAME);

exports.main = async (event, context) => {
  const { action, report, reportId } = event;
  
  try {
    if (action === 'saveReport') {
      const result = await saveReport(report);
      return result;
    } else if (action === 'getReports') {
      const result = await getReports();
      return result;
    } else if (action === 'getReport') {
      const result = await getReport(reportId);
      return result;
    } else if (action === 'deleteReport') {
      const result = await deleteReport(reportId);
      return result;
    } else {
      return {
        success: false,
        message: '未知操作'
      };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: '云函数执行失败',
      error: error.message
    };
  }
};

/**
 * 存储报告
 */
async function saveReport(report) {
  try {
    const reportData = {
      ...report,
      createdAt: new Date().toISOString()
    };
    
    const result = await reportCollection.add(reportData);
    
    return {
      success: true,
      data: {
        ...reportData,
        _id: result.id
      },
      message: '报告存储成功'
    };
  } catch (error) {
    // 如果是表不存在错误，尝试自动创建
    if (error.message.includes('not_found')) {
      await initCollection();
      // 重试一次
      const reportData = { ...report, createdAt: new Date().toISOString() };
      const result = await reportCollection.add(reportData);
      return {
        success: true,
        data: { ...reportData, _id: result.id },
        message: '表已自动创建并存储成功'
      };
    }

    console.error('存储报告失败:', error);
    return {
      success: false,
      data: null,
      message: '存储报告失败: ' + error.message
    };
  }
}

/**
 * 获取报告列表 (核心修改在这里)
 */
async function getReports() {
  try {
    const result = await reportCollection.orderBy('createdAt', 'desc').get();
    
    return {
      success: true,
      data: result.data,
      message: '获取报告列表成功'
    };
  } catch (error) {
    // 【关键】检测是否是“集合不存在”的错误
    if (error.message.includes('not_found') || error.message.includes('namespace does not exist')) {
      console.log('检测到 reports 表不存在，正在自动创建...');
      await initCollection(); // 自动初始化表
      
      // 表创建成功后，重新查询一次（此时应该是空数组）
      const result = await reportCollection.orderBy('createdAt', 'desc').get();
      return {
        success: true,
        data: result.data,
        message: '表不存在已自动创建，当前无数据'
      };
    }

    console.error('获取报告列表失败:', error);
    return {
      success: false,
      data: null,
      message: '获取报告列表失败: ' + error.message
    };
  }
}

/**
 * 辅助函数：初始化集合（插入一条测试数据以触发建表）
 */
async function initCollection() {
  try {
    await db.collection(REPORT_COLLECTION_NAME).add({
      title: '初始化测试数据',
      content: '此数据用于自动创建 reports 集合，可删除',
      createdAt: new Date().toISOString(),
      isInit: true
    });
    console.log('reports 集合创建成功！');
  } catch (e) {
    console.error('自动建表失败:', e);
    throw e;
  }
}

/**
 * 获取单个报告
 */
async function getReport(reportId) {
  try {
    const result = await reportCollection.doc(reportId).get();
    
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
        message: '获取报告成功'
      };
    } else {
      return {
        success: false,
        data: null,
        message: '报告不存在'
      };
    }
  } catch (error) {
    if (error.message.includes('not_found')) {
      await initCollection();
      return { success: false, data: null, message: '表不存在已自动创建，请重试获取' };
    }
    console.error('获取报告失败:', error);
    return {
      success: false,
      data: null,
      message: '获取报告失败: ' + error.message
    };
  }
}

/**
 * 删除报告
 */
async function deleteReport(reportId) {
  try {
    const result = await reportCollection.doc(reportId).remove();
    
    if (result.deleted === 1) {
      return {
        success: true,
        data: null,
        message: '删除报告成功'
      };
    } else {
      return {
        success: false,
        data: null,
        message: '删除报告失败：未找到该记录'
      };
    }
  } catch (error) {
    console.error('删除报告失败:', error);
    return {
      success: false,
      data: null,
      message: '删除报告失败: ' + error.message
    };
  }
}