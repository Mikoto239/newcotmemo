import React, { useState, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,ResponsiveContainer } from 'recharts';
import axios from 'axios';
import HeaderDashboard from '../../components/headerdashboard';
import Footer from '../../components/footer';
import { Link } from 'react-router-dom';

const AdminReport = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('Report List');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default year
  const [monthlyData, setMonthlyData] = useState([]);
  const startYear = 2000;
  const endYear = new Date().getFullYear();
  const years = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  const token = localStorage.getItem('token');

  const handleMenuItemClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  const handleMonthChange = (event) => {
    const selectedMonthValue = event.target.value;
    setSelectedMonth(selectedMonthValue);
    handleDate(selectedMonthValue, selectedYear);
  };
  
  const handleYearChange = (event) => {
    const selectedYearValue = event.target.value;
    setSelectedYear(selectedYearValue);
    handleDate(selectedMonth, selectedYearValue);
  };

  const handleDate = async (month, year) => {
    try {
      const getme = await axios.get('/api/getme', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const email = getme.data.user.email;

      const Allreport = await axios.post('/api/allreport', {
        email,
        month,
        year,
      });

      if (Allreport.data === false) {
        setMonthlyData([]);
        return;
      }

      const ReceiveMemoReport = Allreport.data.receivememo || [];
      const SendMemoReport = Allreport.data.sentmemo || [];

      setMonthlyData(generateMonthlyData(ReceiveMemoReport, SendMemoReport));
    } catch (error) {
      console.log(error);
    }
  };

  const generateMonthlyData = (receiveMemos, sendMemos) => {
    const daysInMonth = 31;
    const monthlyData = [];
  
    for (let day = 1; day <= daysInMonth; day++) {
      const sentOnDay = sendMemos.filter(memo => getDayFromDate(memo.createdAt) === day);
      const receivedOnDay = receiveMemos.filter(memo => getDayFromDate(memo.createdAt) === day);
  
      monthlyData.push({
        name: `Day ${day}`,
        Sent: sentOnDay.length,
        Received: receivedOnDay.length,
        sentMemos: sentOnDay, 
        receivedMemos: receivedOnDay, 
      });
    }
  
    return monthlyData;
  };
  

  const getDayFromDate = (date) => {
    return new Date(date).getDate();
  };

  useEffect(() => {
    handleDate(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  return (
    <>
      <HeaderDashboard />
      <div className="content-header">
        <div>
          <h1>Report</h1>
        </div>
        
        
      </div>
      <div className="dashboard">
     
      <div className="sidebar">
        <ul>
        <li className={activeMenuItem === 'Dashboard' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Dashboard')} href="/admin/dashboard">
                Dashboard
              </a>
            </li>
            <li className={activeMenuItem === 'Memo Manager' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Memo Manager')} href="/admin/memo_manager">
                Memo Manager
              </a>
            </li>
            <li className={activeMenuItem === 'Calendar' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Calendar')} href="/admin/calendar">
                Calendar
              </a>
            </li>
            <li className={activeMenuItem === 'Faculty Manager' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Faculty Manager')} href="/admin/faculty_manager">
                Faculty Manager
              </a>
            </li>
            <li className={activeMenuItem === 'Report List' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Report List')} href="/admin/report_list">
                Report List
              </a>
            </li>
            <li className={activeMenuItem === 'Invite Members' ? 'active' : ''}>
              <a onClick={() => handleMenuItemClick('Invite Members')} href="/admin/inviteMember">
                Invite Members
              </a>
            </li>
         
          </ul>
        </div>

        <div className="content">
        
          <div>
            <label htmlFor="monthSelect">Select Month: </label>
            <select id="monthSelect" onChange={handleMonthChange} value={selectedMonth}>
            <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div>
            <label htmlFor="yearSelect">Select Year: </label>
            <select id="yearSelect" onChange={handleYearChange} value={selectedYear}>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className='Graph-report'>
          <LineChart
  width={730}
  height={250}
  data={monthlyData}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
  style={{ background: 'white' }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis tickFormatter={(tick) => Math.round(tick)} />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="Sent" stroke="red" />
  <Line type="monotone" dataKey="Received" stroke="blue" />
</LineChart>

          </div>
          <div className='report-list-memo-details'>
          <h3>Details</h3>
          </div>
         
          <div className="memo-details-on-that-day">
  {monthlyData.map((dayData, index) => (
    dayData.Create > 0 || dayData.Receive > 0 ? (
      <div key={index}>
        <h3>{dayData.name}:</h3>
        <ul>
          {dayData.sentMemos.length > 0 && (
            <>
              <p className="section-header"><strong>Sent Memo</strong></p>
              {dayData.sentMemos.map((sentMemo, sentIndex) => (
                <li key={`sent-${sentIndex}`}>
                  <b>Title:</b> {sentMemo.title}
                  {' '}
                  <Link to={`/admin/sent_report/${sentMemo._id}`} className="view-details">View Details</Link>
                </li>
              ))}
            </>
          )}
          {dayData.receivedMemos.length > 0 && (
            <>
              <p className="section-header"><strong>Received Memo</strong></p>
              {dayData.receivedMemos.map((receivedMemo, receivedIndex) => (
                <li key={`received-${receivedMemo.createdAt}`}>
                 <b> Sender: </b>{receivedMemo.sender},                     <b>Title: </b>{receivedMemo.title}                     
                  {' '}
                  <Link to={`/admin/recieve_memo/${receivedMemo._id}`} className="view-details">View Details</Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    ) : null
  ))}
</div>


        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminReport;
