import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';
import MicIcon from '@mui/icons-material/Mic';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import SpaIcon from '@mui/icons-material/Spa';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import PersonIcon from '@mui/icons-material/Person';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Import graphics
import medicinalPlantsImg from './assets/圖片1-泰雅族藥用動植物知識 Atayal medicinal plants and animals.png';
import translateChineseImg from './assets/圖片2-華語翻譯成泰雅語 Translate Chinese to Atayal.png';
import translateAtayalImg from './assets/圖片3-泰雅語翻譯成華語 Translate Atayal to Chinese.png';
import transcribeImg from './assets/圖片4-泰雅語音轉文字 Transcribe Atayal speech to text.png';
import learnSentencesImg from './assets/圖片5-學習目標句 Learn Atayal sentences.png';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f57983',
      light: '#ff9aa4',
      dark: '#e0616c',
    },
    secondary: {
      main: '#ff9aa4',
      light: '#ffb3bc',
      dark: '#e97f8a',
    },
    background: {
      default: '#FFF5EE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3748',
      secondary: '#4A5568',
    },
  },
  typography: {
    h4: {
      fontWeight: 700,
      color: '#f57983',
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
      color: '#2D3748',
      letterSpacing: '-0.25px',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// API endpoints - Currently only 1 API is connected, 3 more need integration
// TODO: Integrate all 4 APIs as mentioned by 範白松
const ASR_API_BASE = 'https://service.dltechlab.top/atayal_asr';
const TTS_API_BASE = 'https://service.dltechlab.top/atayal_tts';
const TRANS_API_BASE = 'https://service.dltechlab.top/atayal_trans';

// Translation APIs
const translateChineseToAtayal = async (text: string): Promise<string> => {
  const url = `${TRANS_API_BASE}/translate/chinese-to-atayal`;
  const body = {
    language_id: 'zh',
    max_length: 128,
    reference_id: `req-${Date.now()}`,
    text,
  };
  // Try direct, then proxies
  const candidates = [
    { url, useProxy: false },
    { url: `https://cors-anywhere.herokuapp.com/${url}`, useProxy: true },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, useProxy: true },
    { url: `https://thingproxy.freeboard.io/fetch/${url}`, useProxy: true },
  ];
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data?.atayal_text === 'string') return data.atayal_text;
      return JSON.stringify(data);
    } catch (e) {
      continue;
    }
  }
  throw new Error('Translation service unreachable (CORS/proxy blocked).');
};

const translateAtayalToChinese = async (text: string): Promise<string> => {
  const url = `${TRANS_API_BASE}/translate/atayal-to-chinese`;
  const body = {
    language_id: 'atayal',
    max_length: 128,
    reference_id: `req-${Date.now()}`,
    text,
  };
  const candidates = [
    { url, useProxy: false },
    { url: `https://cors-anywhere.herokuapp.com/${url}`, useProxy: true },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, useProxy: true },
    { url: `https://thingproxy.freeboard.io/fetch/${url}`, useProxy: true },
  ];
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data?.chinese_text === 'string') return data.chinese_text;
      return JSON.stringify(data);
    } catch (e) {
      continue;
    }
  }
  throw new Error('Translation service unreachable (CORS/proxy blocked).');
};

// API functions - Priority is to ensure system works with any audio input
const uploadAudioForTranscription = async (audioFile: File, targetLanguage: 'chinese' | 'atayal') => {
  const formData = new FormData();
  formData.append('file', audioFile);
  
  const endpoint = targetLanguage === 'chinese' ? '/to_chinese/' : '/to_atayal/';
  const fullUrl = `${ASR_API_BASE}${endpoint}`;

  try {
    // Chỉ dùng các endpoint có hỗ trợ POST body
    const candidates = [
      { url: fullUrl, proxy: false },
      { url: `https://cors-anywhere.herokuapp.com/${fullUrl}`, proxy: true },
    ];

    let lastError: unknown = null;
    for (const c of candidates) {
      try {
        const res = await fetch(c.url, {
            method: 'POST',
          // KHÔNG đặt 'Content-Type' để browser tự thêm multipart boundary
          headers: { 'accept': 'application/json' },
            body: formData,
          });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} - ${txt}`);
        }
        let resultText = '';
        try {
          // Dùng clone để có thể fallback sang text nếu không phải JSON
          const data = await res.clone().json();
          if (typeof data === 'string') {
            resultText = data;
          } else if (data && typeof (data as any).text === 'string') {
            resultText = (data as any).text;
        } else {
            resultText = JSON.stringify(data);
          }
        } catch {
          resultText = await res.text();
        }
        const clean = resultText.replace(/\[\d+\.\d+-\d+\.\d+s\]\s*/g, '').trim();
        return clean || resultText;
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    throw lastError ?? new Error('All attempts failed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (/Failed to fetch|NetworkError/i.test(errorMessage)) {
      throw new Error('Network error: Please check your internet connection and try again.');
    }
    if (/cors-anywhere/i.test(String(errorMessage))) {
      throw new Error('Proxy blocked. Try enabling CORS Anywhere or contact admin.');
    }
    throw new Error(`Transcription service temporarily unavailable: ${errorMessage}`);
  }
};

const generateSpeech = async (text: string, spkid: number, filename: string) => {
  const params = new URLSearchParams({
    text,
    spkid: spkid.toString(),
    filename,
  });
  
  try {
    const response = await fetch(`${TTS_API_BASE}/inference?${params}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Speech generation failed: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Speech generation service temporarily unavailable');
  }
};

// ASR with answer for scoring pronunciation (see docs: https://service.dltechlab.top/atayal_asr/docs#/default/upload_wav_to_atayal__post)
const uploadAudioWithAnsToAtayal = async (audioBlob: Blob, ans: string) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');

  const fullUrl = `${ASR_API_BASE}/to_atayal/?ans=${encodeURIComponent(ans)}`;

  try {
    const res = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }

    const data = await res.json();
    return {
      transcription: typeof data?.transcription === 'string' ? data.transcription : '',
      score: typeof data?.score === 'number' ? data.score : null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (/Failed to fetch|NetworkError/i.test(errorMessage)) {
      throw new Error('Network error: Please check your internet connection and try again.');
    }
    throw new Error(`Scoring service temporarily unavailable: ${errorMessage}`);
  }
};

// TODO: Add integration for the remaining 3 APIs
// - API 2: [To be clarified in tomorrow's meeting]
// - API 3: [To be clarified in tomorrow's meeting] 
// - API 4: [To be clarified in tomorrow's meeting]

// Styled components with red theme
const StyledPaper = styled(Paper)`
  padding: 2.5rem;
  margin: 1.5rem 0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  background: linear-gradient(145deg, #ffffff, #FFF5EE);
  border: 1px solid rgba(245, 121, 131, 0.35);
`;

// removed unused SectionBox

const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 1.25rem;
  border: 2px solid #FFC9A6;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  background-color: #FFFFFF;
  color: #2D3748;
  
  &:focus {
    outline: none;
    border-color: #FFC9A6;
    box-shadow: 0 0 0 4px rgba(255, 201, 166, 0.15);
  }
  
  &::placeholder {
    color: #A0AEC0;
  }
`;

const UploadButton = styled.label`
  background-color: #f57983;
  color: #2D3748;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  letter-spacing: 0.3px;
  
  &:hover {
    background-color: #e97f8a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  }
  
  &:disabled {
    background-color: #eee;
    color: #999;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 22px;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${props => props.variant === 'secondary' ? '#ff9aa4' : '#f57983'};
  color: #2D3748;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  letter-spacing: 0.3px;
  
  &:hover {
    background-color: ${props => props.variant === 'secondary' ? '#e97f8a' : '#e97f8a'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  }
  
  &:disabled {
    background-color: #eee;
    color: #999;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 22px;
  }
`;

// removed unused ButtonGroup

// removed unused Header

const Layout = styled(Box)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

// removed unused NavDrawer

// removed unused NavHeader

// removed unused NavItem

const MainContent = styled(Box)`
  flex: 1;
  padding: 2rem;
  background-color: #FFF5EE;
`;

// removed unused MenuButton

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  width: 100%;
`;

const HomeNavGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 2.5rem;
  justify-items: center;
  align-items: stretch;
  margin: 3rem auto 0 auto;
  max-width: 900px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 600px;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 350px;
  }
`;

const HomeNavItem = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 2rem 1.5rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  min-width: 140px;
  min-height: 200px;
  width: 100%;
  position: relative;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 6px 20px rgba(255, 201, 166, 0.15);
    transform: translateY(-4px) scale(1.04);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 201, 166, 0.1) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const HomeNavIcon = styled(Box)`
  font-size: 48px;
  color: #f57983;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
`;

const HomeNavText = styled(Typography)`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2D3748;
  text-align: center;
  line-height: 1.4;
  position: relative;
  z-index: 1;
`;

const HomeNavImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: block;
`;

const BilingualText = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const EnglishText = styled(Typography)`
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
`;

// Navigation data with bilingual support - Updated order
const navItems = [
  { 
    text: '首頁', 
    english: 'Home',
    icon: <HomeIcon />, 
    path: '/'
  },
  { 
    text: '泰雅族藥用動植物知識', 
    english: 'Atayal Medicinal Plants and Animals',
    icon: <img src={`${process.env.PUBLIC_URL}/book.png`} alt="book" style={{ width: 20, height: 20, borderRadius: 2 }} />, 
    path: '/medicinal'
  },
  { 
    text: '華語翻譯成泰雅語', 
    english: 'Translate Chinese to Atayal',
    icon: <MicIcon />, 
    path: '/transatayal'
  },
  { 
    text: '泰雅語翻譯成華語', 
    english: 'Translate Atayal to Chinese',
    icon: <VolumeUpIcon />, 
    path: '/transchinese'
  },
  { 
    text: '泰雅語音轉文字', 
    english: 'Transcribe Atayal Speech to Text',
    icon: <AudiotrackIcon />, 
    path: '/transcribe'
  },
  { 
    text: '學習目標句', 
    english: 'Learn Atayal Sentences',
    icon: <MenuBookIcon />, 
    path: '/learning'
  },
];

const homeNavs = [
  {
    icon: <LocalFloristIcon sx={{ fontSize: 48 }} />, 
    text: '藥用動植物', 
    english: 'Medicinal Plants and Animals',
    path: 'https://sites.google.com/view/atayalmedical/home'
  },
  {
    icon: <SpaIcon sx={{ fontSize: 48 }} />, 
    text: '泛靈信仰和醫療', 
    english: 'Animism and Medicine',
    path: 'https://sites.google.com/view/atayalmedical/home'
  },
  {
    icon: <FamilyRestroomIcon sx={{ fontSize: 48 }} />, 
    text: '婚育習俗', 
    english: 'Marriage and Childbirth Customs',
    path: 'https://sites.google.com/view/atayalmedical/home'
  },
  {
    icon: <CoronavirusIcon sx={{ fontSize: 48 }} />, 
    text: '大規模傳染病', 
    english: 'Large-scale Infectious Diseases',
    path: 'https://sites.google.com/view/atayalmedical/home'
  },
  {
    icon: <PersonIcon sx={{ fontSize: 48 }} />, 
    text: '泰雅醫生故事', 
    english: 'Atayal Doctor Stories',
    path: 'https://sites.google.com/view/atayalmedical/home'
  },
];

const Navigation = () => {
  const logoSrc = process.env.PUBLIC_URL + '/logo192.png';
  return (
    <AppBar position="static" elevation={0} sx={{
      background: 'linear-gradient(180deg, #f57983 0%, #e97f8a 100%)',
      color: '#2D3748',
      borderBottom: '1px solid rgba(0,0,0,0.05)'
    }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 72 }}>
        {/* Left: Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StyledLink to="/">
            <img src={logoSrc} alt="logo" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          </StyledLink>
        </Box>
        {/* Center: Title (bilingual) */}
        <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <StyledLink to="/">
            <Typography sx={{ fontWeight: 800, letterSpacing: 1, color: '#2D3748', whiteSpace: 'nowrap' }}>
              泰雅族藥用知識與族語學習AI
            </Typography>
          </StyledLink>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(45,55,72,0.8)', fontStyle: 'italic', mt: 0.5 }}>
            Atayal Medicinal Knowledge and AI-assisted Language Learning
          </Typography>
        </Box>
        {/* Right: (removed quick links) */}
      </Toolbar>
    </AppBar>
  );
};

const SecondaryNav = () => {
  const location = useLocation();
  const currentItem = React.useMemo(() => {
    const found = navItems.find(i => i.path === location.pathname);
    if (found) return found;
    return navItems[0];
  }, [location.pathname]);

  return (
    <Box sx={{
      backgroundColor: '#fff',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}>
      <Box sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: 2,
        pt: 1,
        pb: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2.5,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {navItems.map((item, idx) => (
          <React.Fragment key={item.text}>
            <StyledLink to={item.path}>
              {item.path === '/medicinal' ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <img src={'/book.png'} alt="book" style={{ width: 18, height: 18 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{
                      fontWeight: location.pathname === item.path ? 700 : 600,
                      color: location.pathname === item.path ? '#2D3748' : '#4A5568',
                    }}>
                      {item.text}
        </Typography>
                    <Typography variant="caption" sx={{
                      color: '#A0AEC0',
                      fontStyle: 'italic',
                      lineHeight: 1,
                      mt: 0.25
                    }}>
                      {item.english}
                    </Typography>
                  </Box>
                </Box>
              ) : item.path === '/transatayal' ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <img src={'/Trung.png'} alt="zh" style={{ width: 25, height: 25 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{
                      fontWeight: location.pathname === item.path ? 700 : 600,
                      color: location.pathname === item.path ? '#2D3748' : '#4A5568',
                    }}>
                      {item.text}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: '#A0AEC0',
                      fontStyle: 'italic',
                      lineHeight: 1,
                      mt: 0.25
                    }}>
                      {item.english}
                    </Typography>
                  </Box>
                  <img src={'/T.png'} alt="atayal" style={{ width: 25, height: 25 }} />
                </Box>
              ) : item.path === '/transchinese' ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <img src={'/T.png'} alt="atayal" style={{ width: 25, height: 25 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{
                      fontWeight: location.pathname === item.path ? 700 : 600,
                      color: location.pathname === item.path ? '#2D3748' : '#4A5568',
                    }}>
                      {item.text}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: '#A0AEC0',
                      fontStyle: 'italic',
                      lineHeight: 1,
                      mt: 0.25
                    }}>
                      {item.english}
                    </Typography>
                  </Box>
                  <img src={'/Trung.png'} alt="zh" style={{ width: 25, height: 25 }} />
                </Box>
              ) : item.path === '/transcribe' ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <img src={'/mouth.png'} alt="mouth" style={{ width: 25, height: 25 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{
                      fontWeight: location.pathname === item.path ? 700 : 600,
                      color: location.pathname === item.path ? '#2D3748' : '#4A5568',
                    }}>
                      {item.text}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: '#A0AEC0',
                      fontStyle: 'italic',
                      lineHeight: 1,
                      mt: 0.25
                    }}>
                      {item.english}
                    </Typography>
                  </Box>
                  <img src={'/pen.png'} alt="pen" style={{ width: 25, height: 25 }} />
                </Box>
              ) : (
                <Box sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  px: 0.5,
                  whiteSpace: 'nowrap'
                }}>
                  <Typography sx={{
                    fontWeight: location.pathname === item.path ? 700 : 600,
                    color: location.pathname === item.path ? '#2D3748' : '#4A5568',
                  }}>
                    {item.text}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: '#A0AEC0',
                    fontStyle: 'italic',
                    lineHeight: 1,
                    mt: 0.25
                  }}>
                    {item.english}
                  </Typography>
                </Box>
              )}
        </StyledLink>
            {idx < navItems.length - 1 && (
              <Typography sx={{ color: '#CBD5E0' }}>›</Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

const HomePage = () => (
  <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
    {/* Hero Section */}
    <Box sx={{ 
      textAlign: 'center', 
      mb: 3,
      background: 'linear-gradient(135deg, #FFDAB9 0%, #FFC9A6 100%)',
      borderRadius: '24px',
      padding: '3rem 2rem',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      }} />
      <Typography sx={{ 
        fontWeight: 800, 
        mb: 1.5, 
        letterSpacing: 2,
        position: 'relative',
        zIndex: 1,
        fontSize: { xs: '1.8rem', md: '2.2rem' }
      }}>
        泰雅族藥用知識與族語學習AI
    </Typography>
      <Typography variant="subtitle1" sx={{ 
        mb: 0, 
        fontStyle: 'italic',
        opacity: 0.9,
        position: 'relative',
        zIndex: 1,
      }}>
        Atayal Medicinal Knowledge and AI-assisted Language Learning
    </Typography>
    </Box>

    {/* Small image card outside banner */}
    <SmallImageCard src={medicinalPlantsImg} alt="Atayal Medicinal" />

    {/* Two Intro Cards Only */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {/* Card 1 */}
      <StyledPaper sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
          <InfoOutlinedIcon sx={{ color: '#f57983' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
            介紹 Introduction
          </Typography>
        </Box>
        <Box sx={{ borderLeft: '4px solid #f57983', pl: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.9, color: '#2D3748' }}>
{`本網頁結合泰雅族藥用動植物知識及泰雅AI系統，提供五項功能：`}
          </Typography>
          <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1, color: '#374151' }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f57983', mt: '2px' }} />
              泰雅族藥用動植物知識：呈現研究團隊訪談及蒐集整理的泰雅藥用動植物知識。
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1, color: '#374151' }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f57983', mt: '2px' }} />
              華語翻譯成泰雅語：將華語文字或語音翻譯成泰雅語文字，並提供發音功能，讓學習者說出翻譯出來的泰雅語文字。
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1, color: '#374151' }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f57983', mt: '2px' }} />
              泰雅語翻譯成華語：將泰雅語文字或語音翻譯成華語文字。
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1, color: '#374151' }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f57983', mt: '2px' }} />
              泰雅語音轉文字：轉譯泰雅語音成泰雅文字，方便泰雅語音以文字形式保存。
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1, color: '#374151' }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f57983', mt: '2px' }} />
              學習目標句：學習目標句的發音及比對和泰雅族語老師發音的差異，讓學習者可以自我矯正發音。
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1.5, color: '#4B5563' }}>
            從幼兒到成人的學習者皆可利用此網頁學習泰雅藥用知識及泰雅語。
          </Typography>
        </Box>
      </StyledPaper>

      {/* Card 2 */}
      <StyledPaper sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
          <InfoOutlinedIcon sx={{ color: '#f57983' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
            研究團隊 Research Team
          </Typography>
        </Box>
        <Box sx={{ borderLeft: '4px solid #f57983', pl: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.9, color: '#2D3748' }}>
{`研究團隊：
. 經費來源：國科會、文化部
. 計畫主持人：辛靜婷教授/國立清華大學幼兒教育學系
. 共同主持人：王家慶特聘教授/國立中央大學資訊工程學系
. 顧問：
  Apang Bway 劉芝芳/台灣泰雅族語文學會理事長
  Batu Utaw 姜裕福/桃園市復興區比亞外部落耆老
  Ciwas Behuy 吉娃斯/新竹縣尖石鄉司馬庫斯部落耆老
  Ciwas Buya 張艾潔/新竹縣竹東鎮族語教師
  Hiri' Bawnay' 張秀英/ 新竹縣五峰鄉土場部落耆老
  Kumay Behuy 謝森祿/新竹縣五峰鄉松本部落耆老
  Lawa Tazil 田玉英/新竹縣尖石鄉馬里光部落耆老
  Lesa Batu 范坤松/新竹縣尖石鄉比麟部落耆老
  Masay Sulung 馬賽稣隆/新竹縣尖石鄉司馬庫斯部落耆老
  Momo Apu 曾冰露/新竹縣尖石鄉嘉樂村耆老
  Sayun Yumin 莎韻尤命/新竹縣尖石鄉司馬庫斯部落族語教師
  Sugiy Tosi 素伊多夕/桃園市復興區族語教師
  Tlaw Nayban 張秋生/ 新竹縣五峰鄉白蘭部落耆老
  Toyu Watan 林純桂/桃園市復興區族語教師
  Upah Neban 羅美秋/桃園復興區砂崙子部落耆老
  Watan Taya 張新仙/桃園復興區高義部落耆老
  Yuhaw Taya 邱勇好/ 桃園市復興區比亞外部落耆老
  Yumin Hayung 尤命哈用/新竹縣尖石鄉馬里光部落耆老
. 研究助理:
    . 國立清華大學 ：劉以心、江嘉穗、林憫心、邱子耘、邱筠涵、徐億銓、張妤瑄、張譯云、楊又潔、謝家薰
    . 國立中央大學 ：王騰輝、林祐廷、胡峻愷、黃稟智、詹博丞、範白松`}
          </Typography>
        </Box>
      </StyledPaper>
    </Box>
  </Box>
);

const MedicinalPlantsPage = () => {
  const publicImg = process.env.PUBLIC_URL + '/泰雅藥用動植物知識 Atayal medicinal plants and animals.jpg';
  const [imgSrc, setImgSrc] = React.useState(publicImg);
  React.useEffect(() => {
    const testImg = new Image();
    testImg.src = publicImg;
    testImg.onerror = () => setImgSrc(medicinalPlantsImg);
  }, []);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center', color: '#f57983' }}>
        泰雅族藥用動植物知識
      </Typography>
      <Typography variant="h6" sx={{ color: '#666', mb: 4, textAlign: 'center', fontStyle: 'italic' }}>
        Atayal Medicinal Plants and Animals
      </Typography>

      {/* Layout: image outside + link block beside */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}>
        {/* Image (no paper) */}
        <Box sx={{ flex: '0 0 auto' }}>
          <Box sx={{ width: { xs: 320, md: 420 }, borderRadius: 2, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <img src={imgSrc} alt="Medicinal" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </Box>
        </Box>

        {/* Link block */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#2D3748' }}>
            藥用動植物知識專頁
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 2, lineHeight: 1.8 }}>
            連結至研究團隊整理之藥用動植物知識網站，瀏覽更完整之內容與素材。
          </Typography>
          <ActionButton onClick={() => window.open('https://sites.google.com/view/atayalmedical/home', '_blank')}>
            <LocalFloristIcon /> 前往網站 Visit Site
          </ActionButton>
        </Box>
      </Box>
    </Box>
  );
};

const FaithMedicalPage = () => <Box sx={{ mt: 6, textAlign: 'center' }}><Typography variant="h4">泛靈信仰和醫療</Typography></Box>;
const MarriageCustomsPage = () => <Box sx={{ mt: 6, textAlign: 'center' }}><Typography variant="h4">婚育習俗</Typography></Box>;
const EpidemicPage = () => <Box sx={{ mt: 6, textAlign: 'center' }}><Typography variant="h4">大規模傳染病</Typography></Box>;
const DoctorStoryPage = () => <Box sx={{ mt: 6, textAlign: 'center' }}><Typography variant="h4">泰雅醫生故事</Typography></Box>;

const TranslationLayout = styled(Box)`
  display: flex;
  flex-direction: row;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
  margin-top: 2rem;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const TranslationBox = styled(Paper)`
  flex: 1;
  padding: 2rem 1.5rem;
  border-radius: 14px;
  min-width: 320px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const OutputAudioBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const ProcessButton = styled.button`
  background: #f57983;
  color: #2D3748;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #e97f8a;
  }
`;

const RecordingButton = styled.button<{ variant: 'start' | 'stop' }>`
  background: ${props => props.variant === 'start' ? '#4CAF50' : '#f44336'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'start' ? '#45a049' : '#da190b'};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// removed unused AudioInputBox

const RecordButton = styled(ProcessButton)<{ recording?: boolean }>`
  background: ${props => props.recording ? '#e0616c' : '#4CAF50'};
  &:hover {
    background: ${props => props.recording ? '#cc4f5a' : '#45a049'};
  }
`;

const LearningGrid = styled(Box)`
  display: grid;
  grid-template-columns: 2.2fr 1.2fr 1fr;
  gap: 1.8rem;
  margin: 2.5rem auto 0 auto;
  max-width: 1100px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 640px;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 360px;
  }
`;

const GridCol = styled(Box)`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const GridRow = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80px;
`;

const AtayalText = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #f57983;
  margin-bottom: 0.5rem;
`;

const PhoneticText = styled.div`
  font-size: 1rem;
  color: #37474f;
  margin-bottom: 0.5rem;
`;

const CompareResult = styled.div<{ correct?: boolean }>`
  font-weight: 600;
  color: ${props => props.correct ? '#4caf50' : '#e53935'};
  margin-top: 1rem;
`;

const PlayAudioButton = styled.button`
  background: #f57983;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 0.75rem;
  flex-shrink: 0;
  
  &:hover {
    background: #e97f8a;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    font-size: 20px;
  }
`;

const SentenceRow = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  width: 100%;
`;

const SentenceContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 0.5rem;
`;

// Dữ liệu câu học (Atayal + Chinese)
const learningData = [
  {
    atayal: 'nyux msramu qu qba mu la.',
    chinese: '我的手流血了。',
  },
  {
    atayal: 'baq phtuy ramu qu miquy.',
    chinese: '五節芒可以止血。',
  },
  {
    atayal: 'hopa qu abaw na bgayaw.',
    chinese: '姑婆芋的葉子大大的。',
  },
  {
    atayal: 'hata msqun hkangi wasiq pi!',
    chinese: '一起去找龍葵吧!',
  },
  {
    atayal: 'skbalay pang qu maqaw.',
    chinese: '用馬告來做麵包。',
  },
];

const LearningPage = () => {
  const [scores, setScores] = React.useState<(number | null)[]>(() =>
    Array(learningData.length).fill(null)
  );
  const [isRecording, setIsRecording] = React.useState(false);
  const [isScoring, setIsScoring] = React.useState(false);
  const [recordingIndex, setRecordingIndex] = React.useState<number | null>(null);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [playingIndex, setPlayingIndex] = React.useState<number | null>(null);
  const audioRefs = React.useRef<(HTMLAudioElement | null)[]>([]);

  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
        setIsScoring(true);

        const blob = new Blob(chunks, { type: 'audio/wav' });
        const sentenceIndex = index;
        const ans = learningData[sentenceIndex].atayal;

        try {
          const { score } = await uploadAudioWithAnsToAtayal(blob, ans);
          setScores(prev => {
            const next = [...prev];
            next[sentenceIndex] = score;
            return next;
          });
        } catch (err) {
          console.error('Scoring failed', err);
        } finally {
          setRecordingIndex(null);
          setIsScoring(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingIndex(index);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handlePlayAudio = async (index: number) => {
    // Stop any currently playing audio
    audioRefs.current.forEach((audio, idx) => {
      if (audio && idx !== index) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // If clicking the same audio that's playing, stop it
    if (playingIndex === index && audioRefs.current[index]) {
      audioRefs.current[index]?.pause();
      audioRefs.current[index]!.currentTime = 0;
      setPlayingIndex(null);
      return;
    }

    // Create or reuse audio element
    if (!audioRefs.current[index]) {
      const audio = new Audio(`${process.env.PUBLIC_URL}/${index + 1}.m4a`);
      audioRefs.current[index] = audio;
      
      audio.onended = () => {
        setPlayingIndex(null);
      };
      
      audio.onerror = () => {
        console.error(`Error loading audio for sentence ${index + 1}`);
        setPlayingIndex(null);
      };
    }

    try {
      setPlayingIndex(index);
      await audioRefs.current[index]!.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setPlayingIndex(null);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
        學習目標句
      </Typography>
      <Typography variant="h6" sx={{ color: '#666', mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
        Learn Atayal Sentences
      </Typography>

      {/* Small image card outside banner */}
      <SmallImageCard src={learnSentencesImg} alt="Learn Atayal Sentences" />

      <LearningGrid>
        {/* Cột 1: Learning Sentences */}
        <GridCol>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>Learning Sentences</Typography>
          {learningData.map((item, idx) => (
            <SentenceRow key={idx}>
              <SentenceContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <AtayalText>{item.atayal}</AtayalText>
                  <PhoneticText>{item.chinese}</PhoneticText>
                </Box>
                <PlayAudioButton
                  onClick={() => handlePlayAudio(idx)}
                  title="Play audio"
                >
                  {playingIndex === idx ? (
                    <CircularProgress size={18} sx={{ color: 'white' }} />
                  ) : (
                    <PlayArrowIcon />
                  )}
                </PlayAudioButton>
              </SentenceContent>
            </SentenceRow>
          ))}
        </GridCol>
        {/* Cột 3: Try to speak */}
        <GridCol>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>Try to speak</Typography>
          {learningData.map((item, idx) => (
            <GridRow key={idx}>
              <RecordButton
                style={{ minWidth: 120 }}
                recording={recordingIndex === idx}
                onClick={() => {
                  if (recordingIndex === idx) {
                    stopRecording();
                  } else if (!isRecording) {
                    startRecording(idx);
                  }
                }}
                disabled={isScoring}
              >
                <MicIcon /> {recordingIndex === idx ? 'Stop' : 'Record'}
              </RecordButton>
            </GridRow>
          ))}
        </GridCol>
        {/* Cột 4: Compare */}
        <GridCol>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>Compare</Typography>
          {learningData.map((item, idx) => (
            <GridRow key={idx}>
              <CompareResult correct={(scores[idx] ?? 0) >= 0.75}>
                {isScoring && recordingIndex === idx
                  ? 'Checking...'
                  : scores[idx] != null
                    ? `${Math.round(scores[idx]! * 100)}%`
                    : '--'}
              </CompareResult>
            </GridRow>
          ))}
        </GridCol>
      </LearningGrid>
    </Box>
  );
};

const SmallImageCard = ({ src, alt }: { src: string; alt: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
    <Box sx={{ width: 200, borderRadius: 2, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </Box>
  </Box>
);

// kept SmallImageCardRight if still used elsewhere; otherwise can be removed later

const TranslationPage = ({
  title,
  englishTitle,
  inputPlaceholder,
  outputPlaceholder,
  inputLangLabel,
  outputLangLabel,
  targetLanguage
}: {
  title: string;
  englishTitle: string;
  inputPlaceholder: string;
  outputPlaceholder: string;
  inputLangLabel: React.ReactNode;
  outputLangLabel: React.ReactNode;
  targetLanguage: 'chinese' | 'atayal';
}) => {
  const [inputText, setInputText] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [outputText, setOutputText] = React.useState('');
  const [voice, setVoice] = React.useState<'male' | 'female'>('male');
  const [ttsLoading, setTtsLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = React.useState<Blob[]>([]);

  const handleProcess = async () => {
    if (!inputText.trim()) {
      alert('Please enter text to translate');
        return;
      }

    setProcessing(true);
        try {
          let translated = '';
          if (targetLanguage === 'atayal') {
            translated = await translateChineseToAtayal(inputText);
          } else {
            translated = await translateAtayalToChinese(inputText);
          }
          setProcessing(false);
          setOutputText(translated || '');
        } catch (err) {
          setProcessing(false);
      setOutputText('Translation failed. Please try again.');
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedChunks(chunks);
        // Auto-process the recorded audio
        processRecordedAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    setProcessing(true);
    try {
      // Sử dụng endpoint ngược lại với targetLanguage
      const endpoint = targetLanguage === 'atayal' ? 'to_chinese' : 'to_atayal';
      const result = await uploadAudioForTranscription(audioBlob as File, endpoint as 'chinese' | 'atayal');
      setInputText(result);
      // Auto-translate if we got text
      if (result.trim()) {
        let translated = '';
        if (targetLanguage === 'atayal') {
          translated = await translateChineseToAtayal(result);
        } else {
          translated = await translateAtayalToChinese(result);
        }
        setOutputText(translated);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setInputText(`Error transcribing audio: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!outputText || ttsLoading) return;
    try {
      setTtsLoading(true);
      const spkid = voice === 'female' ? 0 : 1; // female=0, male=1
      const blob = await generateSpeech(outputText, spkid, 'test');
      const url = URL.createObjectURL(blob);
      // Cleanup previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setTtsLoading(false);
      };
      await audio.play();
      setTtsLoading(false);
    } catch (err) {
      setTtsLoading(false);
      console.error('TTS play failed:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <StyledPaper>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#f57983', textAlign: 'center' }}>
          文字翻譯
      </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: '#666' }}>
          Text Translation
      </Typography>
        
        {/* Input Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#f57983' }}>
            {inputLangLabel}
          </Typography>
          
          {/* Recording Button */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            {!isRecording ? (
              <RecordingButton 
                variant="start"
                onClick={startRecording} 
                disabled={processing}
              >
                🎤 開始錄音 Start Recording
              </RecordingButton>
            ) : (
              <RecordingButton 
                variant="stop"
                onClick={stopRecording}
              >
                ⏹️ 停止錄音 Stop Recording
              </RecordingButton>
            )}
          </Box>
          
          <TextArea
            placeholder={inputPlaceholder}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={processing}
            style={{ minHeight: '120px' }}
          />
          </Box>

        {/* Translate Button */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ProcessButton onClick={handleProcess} disabled={processing || !inputText.trim()}>
            {processing && <CircularProgress size={20} color="inherit" />} 
            開始翻譯 Start Translation
          </ProcessButton>
        </Box>
        
        {/* Output Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#f57983' }}>
            {outputLangLabel}
          </Typography>
          <TextArea
            placeholder={outputPlaceholder}
            value={outputText}
            readOnly
            style={{ minHeight: '120px' }}
          />
        </Box>

        {/* Voice Selection and Audio Output */}
        {outputText && (
          <Box>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Voice Selection</FormLabel>
            <RadioGroup
              row
              value={voice}
              onChange={e => setVoice(e.target.value as 'male' | 'female')}
            >
              <FormControlLabel value="male" control={<Radio />} label={<MaleIcon />} />
              <FormControlLabel value="female" control={<Radio />} label={<FemaleIcon />} />
            </RadioGroup>
          </FormControl>
            
          <OutputAudioBox>
            <ProcessButton 
              onClick={handlePlayAudio}
              disabled={ttsLoading || !outputText}
                style={{ background: '#FFDAB9', minWidth: 48, padding: '0.5rem 1.2rem' }}
            >
              {ttsLoading ? <CircularProgress size={20} color="inherit" /> : <VolumeUpIcon />}
            </ProcessButton>
            <Typography variant="body2">Play output audio</Typography>
          </OutputAudioBox>
          </Box>
        )}
      </StyledPaper>
    </Box>
  );
};

// ASR (Chinese -> Atayal)
const ASRPage = () => {
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      {/* Title with icons left/right inline */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
        <img src={'/Trungcolor.png'} alt="zh" style={{ width: 28, height: 28 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
          華語翻譯成泰雅語
        </Typography>
        <img src={'/Tcolor.png'} alt="atayal" style={{ width: 28, height: 28 }} />
      </Box>
      <Typography variant="h6" sx={{ color: '#666', mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
        Translate Chinese to Atayal
      </Typography>

      {/* Small image card outside banner */}
      <SmallImageCard src={translateChineseImg} alt="Translate Chinese to Atayal" />

      

      <TranslationPage
        title=""
        englishTitle=""
        inputPlaceholder="Enter Chinese text..."
        outputPlaceholder="Atayal translation will appear here..."
        inputLangLabel={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={'/Trungwhite.png'} alt="zh" style={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>華語輸入 Chinese Input</Typography>
          </Box>
        }
        outputLangLabel={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={'/Twhite.png'} alt="atayal" style={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>泰雅語輸出 Atayal Output</Typography>
          </Box>
        }
        targetLanguage="atayal"
      />
    </Box>
  );
};

// TTS (Atayal -> Chinese)
const TTSPage = () => {
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      {/* Title with icons left/right (Atayal left, Chinese right) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
        <img src={'/Tcolor.png'} alt="atayal" style={{ width: 28, height: 28 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
          泰雅語翻譯成華語
        </Typography>
        <img src={'/Trungcolor.png'} alt="zh" style={{ width: 28, height: 28 }} />
      </Box>
      <Typography variant="h6" sx={{ color: '#666', mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
        Translate Atayal to Chinese
      </Typography>

      {/* Small image card outside banner */}
      <SmallImageCard src={translateAtayalImg} alt="Translate Atayal to Chinese" />

      <TranslationPage
        title=""
        englishTitle=""
        inputPlaceholder="Enter Atayal text..."
        outputPlaceholder="Chinese translation will appear here..."
        inputLangLabel={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={'/Twhite.png'} alt="atayal" style={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>泰雅語輸入 Atayal Input</Typography>
          </Box>
        }
        outputLangLabel={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={'/Trungwhite.png'} alt="zh" style={{ width: 30, height: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>華語輸出 Chinese Output</Typography>
          </Box>
        }
        targetLanguage="chinese"
      />
    </Box>
  );
};

// Transcribe page: small image card + simplified interface (already simplified)
const TranscribePage = () => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string>('');
  const [processing, setProcessing] = React.useState(false);
  const [outputText, setOutputText] = React.useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = React.useState<Blob[]>([]);

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // API khuyến nghị WAV; cho phép nhưng cảnh báo mềm nếu không phải wav
    const isWav = /\.wav$/i.test(file.name) || file.type === 'audio/wav' || file.type === 'audio/x-wav';
    if (!isWav) {
      // Không chặn hoàn toàn, vẫn cho phép thử
      console.warn('Non-WAV file selected; API recommends WAV.');
    }
    setSelectedFile(file);
    setUploadedFileName(file.name);
  };

  const handleProcess = async () => {
    if (!selectedFile || processing) return;
    setProcessing(true);
    setOutputText('');
    try {
      // Theo yêu cầu trang: Transcribe Atayal Speech to Text => targetLanguage = 'atayal'
      const result = await uploadAudioForTranscription(selectedFile, 'atayal');
      setOutputText(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setOutputText(`Error: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedChunks(chunks);
        // Auto-process the recorded audio
        processRecordedAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    setProcessing(true);
    setOutputText('');
    try {
      // Trang Transcribe: thu âm Atayal → text Atayal
      const result = await uploadAudioForTranscription(audioBlob as File, 'atayal');
      setOutputText(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setOutputText(`Error transcribing audio: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
        泰雅語音轉文字
      </Typography>
      <Typography variant="h6" sx={{ color: '#666', mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
        Transcribe Atayal Speech to Text
      </Typography>

      {/* Small image card outside banner */}
      <SmallImageCard src={transcribeImg} alt="Transcribe Atayal Speech to Text" />

      {/* Simplified transcription interface */}
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <StyledPaper>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#f57983', textAlign: 'center' }}>
            上傳音檔進行轉錄
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: '#666' }}>
            Upload Audio File for Transcription (WAV recommended)
          </Typography>
          
          {/* Audio Upload Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <img src={'/mouth.png'} alt="mouth" style={{ width: 24, height: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>
                音檔上傳 Audio Upload
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              支援格式：WAV（推薦）、其他常見音訊格式可嘗試
            </Typography>
            <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
              Supported formats: WAV (recommended); other audio types may work
            </Typography>
            
            {/* Recording Button */}
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
              {!isRecording ? (
                <RecordingButton 
                  variant="start"
                  onClick={startRecording} 
                  disabled={processing}
                >
                  🎤 開始錄音 Start Recording
                </RecordingButton>
              ) : (
                <RecordingButton 
                  variant="stop"
                  onClick={stopRecording}
                >
                  ⏹️ 停止錄音 Stop Recording
                </RecordingButton>
              )}
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <input
                accept="audio/*"
                style={{ display: 'none' }}
                id="transcribe-audio-upload"
                type="file"
                onChange={handleFilePick}
              />
              <UploadButton htmlFor="transcribe-audio-upload" style={{ 
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.6 : 1
              }}>
                <AudiotrackIcon /> 選擇音檔 Choose Audio File
              </UploadButton>
              {uploadedFileName && (
                <Typography variant="body2" sx={{ mt: 1, color: '#f57983' }}>
                  📁 {uploadedFileName}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Process Button */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <ProcessButton onClick={handleProcess} disabled={processing || !selectedFile}>
              {processing && <CircularProgress size={20} color="inherit" />} 開始轉錄 Start Transcription
            </ProcessButton>
          </Box>
          
          {/* Output Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <img src={'/pen.png'} alt="pen" style={{ width: 24, height: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57983' }}>
                轉錄結果 Transcription Result
              </Typography>
            </Box>
            <TextArea
              placeholder="轉錄結果將顯示在這裡... / Transcription result will appear here..."
              value={outputText}
              readOnly
              style={{ minHeight: '120px' }}
            />
          </Box>
        </StyledPaper>
      </Box>
    </Box>
  );
};

// Learning page: small image card
// (keep existing content)
// Insert small card before the grid
const LearningPageHeader: React.FC = () => (
  <>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
      學習目標句
    </Typography>
    <Typography variant="h6" sx={{ color: '#666', mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
      Learn Atayal Sentences
    </Typography>
    <SmallImageCard src={learnSentencesImg} alt="Learn Atayal Sentences" />
  </>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Navigation />
          <SecondaryNav />
          <MainContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/medicinal" element={<MedicinalPlantsPage />} />
              <Route path="/transatayal" element={<ASRPage />} />
              <Route path="/transchinese" element={<TTSPage />} />
              <Route path="/transcribe" element={<TranscribePage />} />
              <Route path="/learning" element={<LearningPage />} />
            </Routes>
          </MainContent>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
