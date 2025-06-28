import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, Button, Snackbar, IconButton, AppBar, Toolbar, Card, Paper, Fade, Badge, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Stack } from '@mui/material';
import { Close, LocationOn, ContentCopy } from '@mui/icons-material';
import { useGeolocation } from './hooks/useGeolocation';
import { LocationMap } from './components/LocationMap';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { generateRandomString } from './utils';
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

  // URL'den groupId al veya yeni oluştur
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setGroupId(id);
    }
  }, []);

  // userId'yi localStorage'dan al veya oluştur
  useEffect(() => {
    let uid = localStorage.getItem('linkmap_userId');
    if (!uid) {
      uid = uuidv4();
      localStorage.setItem('linkmap_userId', uid);
    }
    setUserId(uid || '');
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
    if (groupId && (!displayName || !photoURL)) {
      setProfileOpen(true);
    }
  }, [groupId]);

  // Fotoğraf seçildiğinde önizleme
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Profil kaydet
  const handleProfileSave = () => {
    if (!displayName || !photoURL) return;
    setProfileOpen(false);
  };

  // Kendi konumunu güncelle (ad ve foto ile birlikte, userId ile tek doküman)
  useEffect(() => {
    if (!location || !groupId || !displayName || !photoURL || !userId) return;
    const updateLocation = async () => {
      const locRef = doc(db, 'locations', `${groupId}_${userId}`);
      await setDoc(locRef, {
        groupId,
        lat: location.latitude,
        lng: location.longitude,
        timestamp: Date.now(),
        displayName,
        photoURL,
        userId
      });
    };
    updateLocation();
  }, [location, groupId, displayName, photoURL, userId]);

  // Link kopyala
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${groupId}`;
    navigator.clipboard.writeText(url);
    setSnackbar({open: true, message: 'Link kopyalandı!'});
  };

  // Aktif kişi sayısı
  const uniqueUserCount = new Set(locations.map(l => l.userId)).size;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={2} sx={{background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)'}}>
        <Toolbar>
          <LocationOn sx={{mr:1}} />
          <Typography variant="h5" sx={{flexGrow:1, fontWeight:700, letterSpacing:1}}>LinkMap</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{mt:6, mb:6}}>
        <Fade in timeout={600}>
          <Box>
            {!groupId ? (
              <Card sx={{p:5, textAlign:'center', boxShadow:3, borderRadius:4}}>
                <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
                  Anlık Konum Paylaşımı
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{mb:3}}>
                  Arkadaşlarınla anlık konum paylaşmak için yeni bir grup oluştur ve linki paylaş. Üyelik gerekmez!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<LocationOn />}
                  onClick={startSharing}
                  size="large"
                  sx={{fontWeight:600, px:4, py:1.5, fontSize:'1.1rem', borderRadius:3, boxShadow:2}}
                >
                  Konum Paylaşmaya Başla
                </Button>
              </Card>
            ) : (
              <Fade in timeout={600}>
                <Box>
                  <Card sx={{p:3, mb:3, boxShadow:2, borderRadius:3, display:'flex', alignItems:'center', gap:2, flexWrap:'wrap'}}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={copyLink}
                      sx={{fontWeight:600, borderRadius:2}}
                    >
                      Linki Kopyala
                    </Button>
                    <Badge badgeContent={uniqueUserCount} color="primary" sx={{ml:2}}>
                      <Typography variant="body1" color="text.secondary">
                        Aktif Kişi
                      </Typography>
                    </Badge>
                  </Card>
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
                  <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
                    Not: Konumlar 5 dakika boyunca güncellenmezse otomatik silinir.
                  </Typography>
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
            <Avatar src={photoURL} sx={{width:64, height:64}}/>
            <Button variant="outlined" component="label">
              Fotoğraf Yükle
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </Button>
            <TextField
              label="Adınız"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileSave} disabled={!displayName || !photoURL} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App
