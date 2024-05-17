const express = require('express');
const route = express.Router();
const path = require('path');
const {  displayMemo, showusermemo, memodetails, isAcknowledgememo, read, memoIcreate, Iacknowledge, memodate, getMyNotifications, Allreport,createdmemo,uploads,createddetails,pdfdetails} = require('../controllers/memo');
const { isAuthenticated, isAdmin, checkRole } = require('../middleware/auth');


route.get('/showmemo', showusermemo);
route.get('/memo/list', displayMemo);
route.get('/memo/details/:memoId', memodetails);
route.post('/memo/acknowledge/:memoId', isAcknowledgememo);
route.post('/memo/uploads',uploads);
route.post('/Iacknowledge/:memoId', Iacknowledge);
route.post('/memo/read', read);
route.get('/memo/created/:memoId',createdmemo);
route.get('/memo/pdfdetails/:memoId',pdfdetails);
route.get('/memo/created_details/:memoId',createddetails);
route.get('/memoIcreate', memoIcreate);
route.post('/memo/send-and-recieve', memodate);
route.post('/getMynotifications', getMyNotifications);
route.post('/allreport', Allreport);

// Error handling middleware
route.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = route;
