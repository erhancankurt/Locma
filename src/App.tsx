import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, Button, Snackbar, IconButton, AppBar, Toolbar, Paper, Fade, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Stack } from '@mui/material';
import { Close, LocationOn, Share as ShareIcon } from '@mui/icons-material';
import { useGeolocation } from './hooks/useGeolocation';
import { LocationMap } from './components/LocationMap';
import { GroupChat } from './components/GroupChat';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { generateRandomString, generateRandomColor } from './utils';
import { v4 as uuidv4 } from 'uuid';
import './App.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
  },
});

// 5 dakikadan eski lokasyonları temizle
const STALE_THRESHOLD = 5 * 60 * 1000;

function App() {
  const [groupId, setGroupId] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string}>({open: false, message: ''});
  const { location, error } = useGeolocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [color, setColor] = useState('');
  const [shareDuration, setShareDuration] = useState(15); // dakika cinsinden, varsayılan 15
  const [shareEndTime, setShareEndTime] = useState<number | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // URL'den groupId al veya yeni oluştur
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setGroupId(id);
    }
  }, []);

  // userId ve rengi localStorage'dan al veya oluştur
  useEffect(() => {
    let uid = localStorage.getItem('linkmap_userId');
    let clr = localStorage.getItem('linkmap_color');
    if (!uid) {
      uid = uuidv4();
      localStorage.setItem('linkmap_userId', uid);
    }
    if (!clr) {
      clr = generateRandomColor();
      localStorage.setItem('linkmap_color', clr);
    }
    setUserId(uid || '');
    setColor(clr || '');
  }, []);

  // Konum paylaşma başlat
  const startSharing = async () => {
    const newGroupId = generateRandomString();
    setGroupId(newGroupId);
    // URL'i güncelle
    window.history.pushState({}, '', `?id=${newGroupId}`);
    setSnackbar({open: true, message: 'Konum paylaşımı başlatıldı! Linki paylaşabilirsiniz.'});
  };

  // Grup konumlarını dinle (benzersiz userId'ye göre kişi sayısı)
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'locations'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const locs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(loc => (now - (loc as any).timestamp) < STALE_THRESHOLD);
      setLocations(locs);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Profil modalını ilk defa konum paylaşırken aç
  useEffect(() => {
    // Profil yüklendiyse tekrar açma
    if (!groupId) return;
    const storedName = localStorage.getItem('linkmap_displayName') || '';
    const storedPhoto = localStorage.getItem('linkmap_photoURL') || '';
    setDisplayName(storedName);
    setPhotoURL(storedPhoto);
    if (!storedName && !profileLoaded) {
      setProfileOpen(true);
    }
    setProfileLoaded(true);
  }, [groupId, profileLoaded]);

  // Fotoğraf seçildiğinde önizleme ve base64'e çevirme
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Profil kaydet
  const handleProfileSave = () => {
    setProfileOpen(false);
    localStorage.setItem('linkmap_displayName', displayName);
    localStorage.setItem('linkmap_photoURL', photoURL);
  };

  // Kendi konumunu güncelle (ad, foto, renk ve paylaşım süresi ile birlikte)
  useEffect(() => {
    if (!location || !groupId || !userId) return;
    // Paylaşım süresi kontrolü
    if (shareEndTime && Date.now() > shareEndTime) return;
    const updateLocation = async () => {
      const locRef = doc(db, 'locations', `${groupId}_${userId}`);
      await setDoc(locRef, {
        groupId,
        lat: location.latitude,
        lng: location.longitude,
        timestamp: Date.now(),
        displayName,
        photoURL,
        userId,
        color
      });
    };
    updateLocation();
  }, [location, groupId, displayName, photoURL, userId, color, shareEndTime]);

  // Paylaşım süresi bitince konumu sil
  useEffect(() => {
    if (!groupId || !userId || !shareEndTime) return;
    if (Date.now() > shareEndTime) {
      // Konumu sil
      const locRef = doc(db, 'locations', `${groupId}_${userId}`);
      setDoc(locRef, {}, { merge: false }); // Boş obje ile sil
    }
  }, [groupId, userId, shareEndTime]);

  // WhatsApp ile paylaş
  const shareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${groupId}`;
    const text = encodeURIComponent('Locma ile anlık konum paylaşımı: ' + url);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Aktif kişi sayısı
  const uniqueUserCount = new Set(locations.map(l => l.userId)).size;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={2} sx={{background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)'}}>
        <Toolbar>
          <LocationOn sx={{mr:1}} />
          <Typography variant="h5" sx={{flexGrow:1, fontWeight:700, letterSpacing:1}}>Locma</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{mt:6, mb:6}}>
        <Fade in timeout={600}>
          <Box>
            {!groupId ? (
              <div className="modern-card" style={{textAlign:'center'}}>
                <Typography variant="h3" fontWeight={800} gutterBottom color="primary.main" sx={{letterSpacing:1.5, mb:2}}>
                  Locma
                </Typography>
                <Typography variant="h5" fontWeight={600} color="secondary" sx={{mb:2}}>
                  Anlık, Üyelik Gerektirmeyen Grup Konum Paylaşımı
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{mb:3, fontSize:'1.1rem'}}>
                  Arkadaşlarınla veya grubunla tek tıkla konum paylaş, herkesin anlık konumunu haritada gör. Üyelik, uygulama indirme veya karmaşık adımlar yok!
                </Typography>
                <Button
                  className="modern-btn"
                  startIcon={<LocationOn />}
                  onClick={startSharing}
                  sx={{ color: '#fff' }}
                >
                  Konum Paylaşmaya Başla
                </Button>
              </div>
            ) : (
              <Fade in timeout={600}>
                <Box>
                  <div className="modern-card" style={{display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', justifyContent:'space-between', marginBottom:24}}>
                    <Button
                      className="modern-btn"
                      startIcon={<ShareIcon />}
                      onClick={shareLink}
                      style={{background:'#25D366', color:'#fff', minWidth:120}}
                    >
                      Paylaş
                    </Button>
                    <span className="modern-badge">
                      <b>{uniqueUserCount}</b> Aktif Kişi
                    </span>
                  </div>
                  <Paper elevation={3} sx={{p:2, borderRadius:3, mb:2, background:'#f5faff'}}>
                    {error ? (
                      <Typography color="error" gutterBottom>
                        {error}
                      </Typography>
                    ) : (
                      <LocationMap
                        locations={locations}
                        myLocation={location ? {
                          lat: location.latitude,
                          lng: location.longitude
                        } : undefined}
                      />
                    )}
                  </Paper>
                  {/* Grup Sohbeti */}
                  <GroupChat
                    groupId={groupId}
                    userId={userId}
                    displayName={displayName}
                    photoURL={photoURL}
                  />
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({open:false, message:''})}
          message={snackbar.message}
          action={
            <IconButton size="small" color="inherit" onClick={() => setSnackbar({open:false, message:''})}>
              <Close fontSize="small" />
            </IconButton>
          }
        />
      </Container>
      <Dialog open={profileOpen} disableEscapeKeyDown>
        <DialogTitle>Profil Bilgileri</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{mt:1}}>
            <Avatar src={photoURL} sx={{width:64, height:64, bgcolor: color}}/>
            <Button variant="outlined" component="label">
              Fotoğraf Yükle (isteğe bağlı)
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </Button>
            <TextField
              label="Adınız (isteğe bağlı)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              fullWidth
            />
            <Box sx={{display:'flex',alignItems:'center',gap:2,mt:1}}>
              <span>Rastgele Renk:</span>
              <Box sx={{width:32,height:32,borderRadius:'50%',background:color,border:'2px solid #ccc'}} />
              <Button size="small" onClick={()=>{const c=generateRandomColor();setColor(c);localStorage.setItem('linkmap_color',c);}}>Yeni Renk</Button>
            </Box>
            <TextField
              label="Konum Paylaşım Süresi (dakika)"
              type="number"
              value={shareDuration}
              onChange={e => setShareDuration(Number(e.target.value))}
              inputProps={{min:1,max:180}}
              fullWidth
              helperText="Süre dolunca konum paylaşımı otomatik durur."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShareEndTime(Date.now() + shareDuration * 60 * 1000);
            handleProfileSave();
          }} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App
