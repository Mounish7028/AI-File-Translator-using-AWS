// src/TextTranslator.js
import React, { useState } from 'react';
import axios from 'axios';
import AWS from 'aws-sdk';
import './App.css';
import logo from './logoproject.png';

AWS.config.update({
  accessKeyId: //'AKIAYS2NXLTIA5LCGKVA',
  secretAccessKey: //'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',
  region: //'ap-south-1'
});

const TextTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);

  const handleTranslateText = async () => {
    if (!inputText || !language) return;
    
    setLoading(true);
    
    try {
      const translate = new AWS.Translate();
      const params = {
        Text: inputText,
        SourceLanguageCode: 'en',
        TargetLanguageCode: language
      };
      
      const translationResult = await translate.translateText(params).promise();
      setTranslatedText(translationResult.TranslatedText);
      
      const wordCount = translationResult.TranslatedText.split(/\s+/).length;
      const now = new Date();
      const newHistoryEntry = {
        
      };
      
     
    } catch (error) {
      console.error('Error translating text:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="TextTranslator">
      <header className="App-header">
        <img src={logo} alt="Logo" className="logo" />
        <h1>Text Translator</h1>
        <textarea 
          placeholder="Enter text to translate..." 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)}
        />
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
        <button onClick={handleTranslateText} disabled={loading || !language}>
          {loading ? 'Translating...' : 'Translate Text'}
        </button>
        {translatedText && (
          <div className="translation-result">
            <h2>Translated Text:</h2>
            <p>{translatedText}</p>
          </div>
        )}
      </header>
    </div>
  );
};

export default TextTranslator;
