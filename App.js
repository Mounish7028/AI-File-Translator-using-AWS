// File: App.js
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import AWS from 'aws-sdk';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TextTranslator from './TextTranslator';
import logo from './logoproject.png';
import './App.css';

AWS.config.update({
  accessKeyId: //'AKIAYS2NXLTIA5LCGKVA',
  secretAccessKey: //'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',
  region: //'ap-south-1'
});

// In-memory database
const db = {
  users: [],
  translations: []
};

const App = () => {
  const [file, setFile] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [signupDetails, setSignupDetails] = useState({
    userId: Date.now().toString(),
    name: '',
    email: '',
    contactNumber: '',
    country: '',
    gender: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchTranslationHistory();
  }, [isAuthenticated]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      setFile(acceptedFiles[0]);
    }
  });

  const handleLoginChange = (e) => {
    setLoginCredentials({ ...loginCredentials, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupDetails({ ...signupDetails, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = () => {
    const { username, password } = loginCredentials;
    const storedUserDetails = db.users.find(user => user.username === username);

    if (storedUserDetails && password === storedUserDetails.password) {
      setIsAuthenticated(true);
      setIsLogin(false);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleSignupSubmit = () => {
    db.users.push(signupDetails);
    alert('Signup successful');
    setIsSignup(false);
  };

  const fetchTranslationHistory = () => {
    if (isAuthenticated) {
      const userHistory = db.translations.filter(translation => translation.userId === signupDetails.userId);
      setTranslationHistory(userHistory);
    }
  };

  const handleTranslate = async () => {
    if (!file || !language) return;

    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      const s3 = new AWS.S3({
        region: 'ap-south-1', // Specify the correct region
        endpoint: 'https://vitupload.s3.ap-south-1.amazonaws.com' // Use the region-specific endpoint
      });

      const bucketName = 'vitupload';
      const uploadParams = {
        Bucket: bucketName,
        Key: file.name,
        Body: file
      };

      const upload = s3.upload(uploadParams);

      upload.on('httpUploadProgress', (progress) => {
        setProgress(Math.round((progress.loaded / progress.total) * 100));
      });

      const trFileObjKey = `translated_${language}_${file.name}`;
      await upload.promise();

      const s3Params = {
        Bucket: bucketName,
        Key: file.name
      };

      const fileData = await s3.getObject(s3Params).promise();
      const translate = new AWS.Translate();
      const params = {
        Document: {
          Content: fileData.Body,
          ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        SourceLanguageCode: 'en',
        TargetLanguageCode: language
      };

      const translationResult = await translate.translateDocument(params).promise();
      const translatedContent = translationResult.TranslatedDocument.Content;

      const trUploadParams = {
        Bucket: 'vitupload',
        Key: trFileObjKey,
        Body: translatedContent,
        ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      await s3.upload(trUploadParams).promise();

      setTranslatedText(`https://vitupload.s3.ap-south-1.amazonaws.com/${trFileObjKey}`);

      const wordCount = translatedContent.split(/\s+/).length;
      const now = new Date();
      const newHistoryEntry = {
        translationId: Date.now().toString(),
        userId: signupDetails.userId,
        filename: file.name,
        words: wordCount,
        targetLanguage: language,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
      };

      db.translations.push(newHistoryEntry);
      setTranslationHistory([...translationHistory, newHistoryEntry]);

      clearInterval(interval);
      setProgress(100);
    } catch (error) {
      console.error('Error translating file:', error);
      clearInterval(interval);
      setLoading(false);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const clearTranslationHistory = () => {
    db.translations = db.translations.filter(translation => translation.userId !== signupDetails.userId);
    setTranslationHistory([]);
  };

  const handleDownload = () => {
    if (translatedText) {
      const link = document.createElement('a');
      link.href = translatedText;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} alt="Logo" className="logo" />
          <h1>AI File Translation using AWS</h1>
          {!isAuthenticated ? (
            <div>
              {isLogin ? (
                <div className="login-form">
                  <h2>Login</h2>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={loginCredentials.username}
                    onChange={handleLoginChange}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginCredentials.password}
                    onChange={handleLoginChange}
                  />
                  <button onClick={handleLoginSubmit}>Submit</button>
                  <button onClick={() => setIsLogin(false)}>Cancel</button>
                </div>
              ) : isSignup ? (
                <div className="signup-form">
                  <h2>Signup</h2>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={signupDetails.name}
                    onChange={handleSignupChange}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={signupDetails.email}
                    onChange={handleSignupChange}
                  />
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="Contact Number"
                    value={signupDetails.contactNumber}
                    onChange={handleSignupChange}
                  />
                  <select
                    name="country"
                    value={signupDetails.country}
                    onChange={handleSignupChange}
                  >
                    <option value="">Select Country</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">UK</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="India">India</option>
                    <option value="Australia">Australia</option>
                    <option value="Brazil">Brazil</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Russia">Russia</option>
                    <option value="UAE">UAE</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Iran">Iran</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Greece">Greece</option>
                    <option value="Siberia">Siberia</option>
                  </select>
                  <select
                    name="gender"
                    value={signupDetails.gender}
                    onChange={handleSignupChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={signupDetails.username}
                    onChange={handleSignupChange}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={signupDetails.password}
                    onChange={handleSignupChange}
                  />
                  <button onClick={handleSignupSubmit}>Submit</button>
                  <button onClick={() => setIsSignup(false)}>Cancel</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setIsLogin(true)}>Login</button>
                  <button onClick={() => setIsSignup(true)}>Signup</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag & drop a file here, or click to select one</p>
              </div>
              {file && (
                <div>
                  <p>Selected file: {file.name}</p>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="">Select Language</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="fr">French</option>
                    <option value="ja">Japanese</option>
                    <option value="es">Spanish</option>
                    <option value="ru">Russian</option>
                    <option value="tr">Turkish</option>
                    <option value="ar">Arabic</option>
                    <option value="id">Indonesian</option>
                    <option value="ko">Korean</option>
                    <option value="pt">Portuguese</option>
                    <option value="vi">Vietnamese</option>
                    <option value="yo">Nigerian (Yoruba)</option>
                    <option value="fa">Persian</option>
                    <option value="it">Italian</option> 
                    <option value="sv">Swedish</option>   
                    <option value="nl">Dutch</option>  
                    <option value="ga">Irish</option> 
                    <option value="el">Greek</option>
                    <option value="pl">Polish</option>
                    <option value="sa">Sanskrit</option>
                    <option value="hi">Hindi</option> 
                    <option value="te">Telugu</option>   
                    <option value="ta">Tamil</option>    
                    <option value="kn">Kannada</option>  
                    <option value="ml">Malayalam</option>   
                    <option value="mr">Marathi</option> 
                    <option value="ur">Urdu</option> 
                    <option value="bn">Bengali</option>
                    <option value="sm">Samoan</option>
                    <option value="fo">Faroese</option>
                    <option value="gl">Galician</option>
                    <option value="mt">Maltese</option>
                    <option value="lb">Luxembourgish</option>
                    <option value="cy">Welsh</option>
                    <option value="qu">Quechua</option>
                    <option value="ay">Aymara</option>
                    <option value="dv">Dhivehi</option>
                    <option value="ht">Haitian Creole</option>
                  </select>
                  <button onClick={handleTranslate} disabled={loading || !language}>
                    {loading ? 'Translating...' : 'Translate File'}
                  </button>
                </div>
              )}
              {progress > 0 && (
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${progress}%` }}>
                    {progress}%
                  </div>
                </div>
              )}
              {translatedText && (
                <div className="translation-result">
                  <h2>Translated File:</h2>
                  <button onClick={handleDownload}>Download</button>
                </div>
              )}
              <Link to="/text-translator">
                <button>Translate Text</button>
              </Link>
              <section className="translation-history">
                <h2>Translation History</h2>
                <table>
                  <thead>
                    <tr>
                      <th>userId</th>
                      <th>translationId</th>
                      <th>Filename</th>
                      <th>Number of Words Translated</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {translationHistory.map((record) => (
                      <tr key={record.translationId}>
                        <td>{record.userId}</td>
                        <td>{record.translationId}</td>
                        <td>{record.filename}</td>
                        <td>{record.words}</td>
                        <td>{record.date}</td>
                        <td>{record.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={clearTranslationHistory}>Clear History</button>
              </section>
            </>
          )}
        </header>
        <Routes>
          <Route path="/text-translator" element={<TextTranslator />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
