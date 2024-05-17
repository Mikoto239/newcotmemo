const Memo = require('../models/memo');
const express= require('express');
const Notification = require('../models/notification');
const fs = require('fs');
const Errorrespond = require('../utils/errorResponds');
const nodemailer = require('nodemailer');const crypto = require('crypto');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream'); // Import gridfs-stream
const path = require('path'); // Import path module
const { MongoClient } = require('mongodb');

const mongouri = process.env.MONGO_URL;
const conn = mongoose.createConnection(mongouri);
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo); // Initialize gridfs-stream
  gfs.collection('uploads');
});

// Initialize GridFsStorage
const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});


const upload = multer({ storage: storage });


exports.createdmemo = async (req, res, next) => {
  const { memoId } = req.params;
  const userEmail = req.query.email;

  try {
    const memo = await Memo.findById(memoId);
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    if (memo.senderEmail !== userEmail) {
      console.log("User email doesn't match sender email");
      const previousPage = req.header('referer') || '/'; // Get the previous page from the referer header or default to '/'
      return res.redirect(previousPage);
    }

    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads' // Replace 'uploads' with your bucket name
    });

    const downloadStream = gfs.openDownloadStream(memo.fileId);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${memo.filename}`);

    // Stream the PDF directly to the response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error fetching memo details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.createddetails = async (req, res, next) => {
  const { memoId } = req.params;
  const userEmail = req.query.email;

  try {
    const showmemo = await Memo.findById(memoId);
    
    if (!showmemo) {
      return res.status(404).json({ success: false, message: "No memo found for the user." });
    }

    if (showmemo.senderEmail !== userEmail) {
      return res.status(403).json({ success: false, message: "Access denied. You are not the sender of this memo." });
    }
    
    res.status(200).json({ success: true, memo: showmemo });
  
  } catch (error) {
    console.error('Error fetching memo details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.uploads = (req, res, next) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'File upload failed.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
      }

      const file = req.file;
      console.log(file); 

      const sender = req.body.sender;
      const senderEmail = req.body.senderEmail;
      const content = req.file.filename; // Using filename as content, you might adjust it according to your need
      const recipients = JSON.parse(req.body.recipients);
      const title = req.body.title;

      if (!sender || !senderEmail) { // Fixed variable name, changed senderName to sender
        return res.status(400).json({ success: false, error: 'Sender email and name are required.' });
      }

      try {
        const memo = await Memo.create({ sender, senderEmail, content, title, recipients, fileId: file.id });

        // Create notifications for each recipient
        for (const recipient of recipients) {
          await Notification.create({
            recipientEmail: recipient.useremail,
            recipientName: recipient.username, // Change this to match your recipient name field
            senderEmail,
            senderName: sender,
            type: 'New Memo',
          });
        }

        res.status(201).json({ success: true, memo });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create memo.' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to upload file.' });
  }
};











exports.displayMemo = async (req, res, next) => {
  const pageSize = 2;
  const page = Number(req.query.pageNumber) || 1;
  const count = await Memo.find({}).estimatedDocumentCount();

  try {
    const memos = await Memo.find() // Fetch a list of memos
    .skip(pageSize * (page - 1)).limit(pageSize)
  
    res.status(200).json({ success: true, memos ,page,pages:Math.ceil(count / pageSize),count}); 
  } catch (error) {
    console.error(error);
    next(error); 
  }
};



exports.pdfdetails = async (req, res, next) => {
  const { memoId } = req.params;
  const userEmail = req.query.email; // Extract user's email from query parameters

  try {
    const memo = await Memo.findById(memoId);
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Check if the user's email is in the memo's recipients
    const isRecipient = memo.recipients.some(recipient => recipient.useremail === userEmail);

    if (!isRecipient) {
      // Redirect the user back to the previous page
      const previousPage = req.header('referer') || '/'; // Get the previous page from the referer header or default to '/'
      return res.redirect(previousPage);
    }

    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads' // Replace 'uploads' with your bucket name
    });

    const downloadStream = gfs.openDownloadStream(memo.fileId);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${memo.filename}`);

    // Stream the PDF directly to the response
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error fetching memo details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.showusermemo = async (req, res, next) => {
  const email = req.query.email; 
  try {
    const showmemo = await Memo.find({ 'recipients.useremail': email });
    res.status(200).json({ success: true, showmemo });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.memodetails = async (req, res, next) => {
  const { memoId } = req.params;
  const userEmail = req.query.email; // Extract user's email from query parameters

  try {
    const memo = await Memo.findById(memoId);
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Check if the user's email is in the memo's recipients
    const isRecipient = memo.recipients.some(recipient => recipient.useremail === userEmail);

    if (!isRecipient) {
      // Redirect the user back to the previous page
      const previousPage = req.header('referer') || '/'; // Get the previous page from the referer header or default to '/'
      return res.redirect(previousPage);
    }

    res.status(200).json({ success: true, memo });
  } catch (error) {
    console.error('Error fetching memo details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.isAcknowledgememo = async (req, res, next) => {
  const { email,name } = req.body;
  const memoId = req.params.memoId;

  try {
    const memo = await Memo.findById(memoId);
    const senderEmail = memo.senderEmail;
    const senderName = memo.senderName;
    if (!memo) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    const recipient = memo.recipients.find(recipient => recipient.useremail === email);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found fdor thasd  is memo' });
    }

    await Notification.create({recipientEmail:senderEmail,recipientName:senderName,senderName:name,senderEmail:email,type:'Acknowledge',memoId:memoId})

    recipient.acknowledge = true;
    await memo.save();

    res.status(200).json({ success: true, message: 'Memo acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging memo:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



exports.Iacknowledge = async (req, res, next) => {
  const { email } = req.body;
  const memoId = req.params.memoId;

  try {
    const memo = await Memo.findById(memoId);

    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    const recipient = memo.recipients.find(
      recipient => recipient.useremail === email
    );

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }


    const acknowledgeStatus = recipient.acknowledge;

    res.status(200).json({ acknowledgeStatus });
  } catch (error) {
    console.error('Error in Iacknowledge:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.read = async (req, res, next) => {
  try {
    const email = req.body.email;
    const memoId = req.body.memoId;

    const memo = await Memo.findOne(memoId);

    if (!memo) {
      const notFoundMemoResponse = {
        success: false,
        message: 'Memo not found'
      };

      console.log('JSON Response:', JSON.stringify(notFoundMemoResponse, null, 2));

      return res.status(404).json(notFoundMemoResponse);
    }

    const recipient = memo.recipients.find(recipient => recipient.useremail === email);

    if (!recipient) {
      const notFoundRecipientResponse = {
        success: false,
        message: 'Recipient not found for this memo'
      };

      console.log('JSON Response:', JSON.stringify(notFoundRecipientResponse, null, 2));

      return res.status(404).json(notFoundRecipientResponse);
    }

    if (recipient.read === true) {
      const alreadyReadResponse = {
        success: true
      };

      console.log('JSON Response:', JSON.stringify(alreadyReadResponse, null, 2));

      return res.status(200).json(alreadyReadResponse);
    }

    recipient.read = true;
    await memo.save();

    const successResponse = {
      success: true
    };

    console.log('JSON Response:', JSON.stringify(successResponse, null, 2));

    res.status(200).json(successResponse);
  } catch (error) {
    console.error('Error acknowledging memo:', error);

    const errorResponse = {
      success: false,
      message: 'Internal server error'
    };

    console.log('JSON Response:', JSON.stringify(errorResponse, null, 2));

    res.status(500).json(errorResponse);
  }
};







exports.memoIcreate = async (req, res, next) => {
  const email = req.query.email; 
  try {
    const showmemo = await Memo.find({ senderEmail: email });
  
    if (showmemo.length === 0) {
    
      return res.status(404).json({ success: false, message: "No memo found for the user." });
    }
    if (showmemo[0].senderEmail !== email) {
      
      return res.status(403).json({ success: false, message: "Access denied. You are not the sender of this memo." });
    }
    
    res.status(200).json({ success: true, showmemo });
  } catch (error) {
    console.error(error);
    next(error);
  }
};



exports.memodate = async (req, res, next) => {
  const myemail = req.body.email;
  const memodate = req.body.date;
  try {
 

    // Retrieve sent memos
    const sentMemos = await Memo.find({
      senderEmail: myemail,
      createdAt: { $gte: new Date(memodate), $lt: new Date(new Date(memodate).getTime() + 86400000) } // 86400000 milliseconds in a day
    
    }).lean(); // Using lean() to get plain JavaScript objects

    // 
    const receivedMemos = await Memo.find({
      'recipients.useremail': myemail,
      createdAt: { $gte: new Date(memodate), $lt: new Date(new Date(memodate).getTime() + 86400000) } 

    }).lean();
    if (sentMemos.length === 0 && receivedMemos.length === 0) {
      return res.status(200).json({ success: true, showmyEvents: [] });
    }
    const sentMemosWithType = sentMemos.map(memo => ({ ...memo, type: 'Sent' }));
    const receivedMemosWithType = receivedMemos.map(memo => ({ ...memo, type: 'New Memo' }));

    const memo = [...sentMemosWithType, ...receivedMemosWithType];

    if (!memo || memo.length === 0) {
      return res.status(404).json({ success: false, message: 'No memos found' });
    }

    res.status(200).json({ success: true, memo });
  } catch (error) {
    console.error(error);
    next(error);
   
  }
};


exports.getMyNotifications = async (req, res, next) => {
  try {
    const email = req.body.email;
    const name = req.body.name;

    const ackNotifications = await Notification.find({ recipientEmail: email, type: 'Acknowledge' });

    const receivedMemos = await Notification.find({ recipientEmail: email, recipientName: name, type: 'New Memo' });

    res.json({ ackNotifications, receivedMemos });
  } catch (error) {
    console.error(error);
    next(error);
  }
};



exports.Allreport = async (req, res, next) => {
  const myemail = req.body.email;
  const month = req.body.month;
  const year = req.body.year;

  try {
    const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    // Check if startDate is a valid date
    if (isNaN(startDate.valueOf()) || isNaN(endDate.valueOf())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const sentMemos = await Memo.find({
      senderEmail: myemail,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();

    const receivedMemos = await Memo.find({
      'recipients.useremail': myemail,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();

    if (sentMemos.length === 0 && receivedMemos.length === 0) {
      return res.status(200).json({ success: true, memo: [] });
    }

    const sentMemosWithType = sentMemos.map((memo) => ({ ...memo, type: 'sent' }));
    const receivedMemosWithType = receivedMemos.map((memo) => ({ ...memo, type: 'received' }));

    res.status(200).json({
      success: true,
      receivememo: receivedMemosWithType,
      sentmemo: sentMemosWithType,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
    next(error);
  }
};
