import { Button, Grid, GridItem, Image } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';
import supabase from '../supabaseClient';

import { useAppContext } from '../context/appContext';
import NameForm from './NameForm';

export default function Header() {
  const { username, setUsername, randomUsername } = useAppContext();

  return (
    <Grid
      templateColumns="max-content 1fr min-content"
      justifyItems="center"
      alignItems="center"
      bg="white"
      position="sticky"
      top="0"
      zIndex="10"
      borderBottom="20px solid #edf2f7"
    >
      <GridItem justifySelf="start" m="2">
        <Image src="/logo.png" height="30px" ml="2" />
      </GridItem>
      <GridItem justifySelf="end" alignSelf="end">
        <NameForm username={username} setUsername={setUsername} />
      </GridItem>
      <Button
        size="sm"
        marginRight="2"
        colorScheme="teal"
        rightIcon={<FaGithub />}
        variant="outline"
        onClick={() => {
          const username = randomUsername();
          setUsername(username);
          localStorage.setItem('username', username);
        }}
      >
        New Username
      </Button>
    </Grid>
  );
}
