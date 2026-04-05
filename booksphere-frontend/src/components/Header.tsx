import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';

export default function Header() {
  const navigate = useNavigate();

  return (null);
  //   <AppBar position="static" color="primary">
  //     <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
  //       <Typography variant="h6" component="div">
  //         BookSphere
  //       </Typography>

  //       <Box sx={{ display: 'flex', gap: 2 }}>
  //         <Button color="inherit" component={Link} to="/home/profile">
  //           Home
  //         </Button>
  //         <Button
  //           color="inherit"
  //           onClick={() => {
  //             navigate({ to: '/home/profile' });
  //           }}
  //         >
  //           Profile
  //         </Button>
  //       </Box>
  //     </Toolbar>
  //   </AppBar>
  // );
}
