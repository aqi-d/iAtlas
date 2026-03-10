const db = uniCloud.database();
const REPORT_COLLECTION_NAME = 'reports';
const reportCollection = db.collection(REPORT_COLLECTION_NAME);

exports.main = async (event, context) => {
  const { action, report, reportId, htmlContent } = event;
  
  try {
   if (action === 'saveReport') {
      const result = await saveReport(report, htmlContent);
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
    return {
      success: false,
      message: '云函数执行失败',
      error: error.message
    };
  }
};

async function saveReport(report, htmlContent) {
  try {
    let fileUrl = report.fileUrl;
    let fileName = report.fileName;

   if (!fileUrl && htmlContent) {
      try {
        const uploadRes = await uploadHtmlToCloud(htmlContent, report.title || 'report');
       fileUrl = uploadRes.fileURL;
       fileName = uploadRes.fileName;
        
       if (!fileUrl) {
          throw new Error('上传成功但未返回有效的 fileURL');
        }
      } catch (uploadErr) {
        return {
          success: false,
          message: '报告数据已准备，但文件上传失败：' + uploadErr.message
        };
      }
    }

    const reportData = {
      ...report,
     fileUrl: fileUrl,
     fileName: fileName,
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
   if (error.message.includes('not_found')) {
      await initCollection();
      return await saveReport(report, htmlContent);
    }

    return {
      success: false,
      data: null,
      message: '存储报告失败：' + error.message
    };
  }
}

async function uploadHtmlToCloud(htmlContent, titlePrefix) {
  const fileName = `${Date.now()}_${titlePrefix}.docx`;
  const cloudPath = `reports/${fileName}`;
  
  const mhtmlContent = convertHtmlToMhtml(htmlContent);
  const buffer = Buffer.from(mhtmlContent, 'utf8');
  
  try {
    const uploadResult = await uniCloud.uploadFile({
      cloudPath: cloudPath,
     fileContent: buffer
    });
    
    const fileID = uploadResult.fileID;
    
   if (!fileID) {
      throw new Error('上传成功但未返回 fileID');
    }
    
    let tempURL = '';

    try {
      const tempUrlRes = await uniCloud.getTempFileURL({
       fileList: [fileID],
        maxAge: 3600 * 24 * 30 
      });
      
     if (tempUrlRes.fileList && tempUrlRes.fileList.length > 0 && tempUrlRes.fileList[0].tempURL) {
        tempURL = tempUrlRes.fileList[0].tempURL;
      } else {
        tempURL = fileID; 
      }
    } catch (urlErr) {
      tempURL = fileID; 
    }
    
   if (!tempURL) {
      throw new Error('无法获取文件下载地址');
    }

    return {
     fileURL: tempURL,
     fileName: fileName,
     fileID: fileID
    };

  } catch (error) {
    throw new Error('上传文件失败：' + (error.message || '未知错误'));
  }
}

function convertHtmlToMhtml(html) {
  const boundary = '----MHTMLBoundary_' + Date.now();
  
  const mhtmlHeader = [
    'From: <localhost>',
    'Subject: Report',
    'MIME-Version: 1.0',
    'Content-Type: multipart/related; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/html',
    'Content-Transfer-Encoding: quoted-printable',
    '',
  ].join('\r\n');
  
  const mhtmlFooter = '\r\n--' + boundary + '--';
  
  return mhtmlHeader + html + mhtmlFooter;
}

async function getReports() {
  try {
    const result = await reportCollection.orderBy('createdAt', 'desc').get();
    
    return {
      success: true,
      data: result.data,
      message: '获取报告列表成功'
    };
  } catch (error) {
   if (error.message.includes('not_found') || error.message.includes('namespace does not exist')) {
      await initCollection();
      const result = await reportCollection.orderBy('createdAt', 'desc').get();
      return {
        success: true,
        data: result.data,
        message: '表不存在已自动创建，当前无数据'
      };
    }

    return {
      success: false,
      data: null,
      message: '获取报告列表失败：' + error.message
    };
  }
}

async function initCollection() {
  try {
    await db.collection(REPORT_COLLECTION_NAME).add({
      title: '初始化测试数据',
      content: '此数据用于自动创建 reports 集合，可删除',
      createdAt: new Date().toISOString(),
      isInit: true
    });
  } catch (e) {
    throw e;
  }
}

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
    return {
      success: false,
      data: null,
      message: '获取报告失败：' + error.message
    };
  }
}

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
    return {
      success: false,
      data: null,
      message: '删除报告失败：' + error.message
    };
  }
}
