import axios from 'axios';

const handleWalletResponse = (
  _endPoint: string,
  clientID: string,
  onGetData: (_: string) => void,
  aesirxAllowedLogins = ['concordium', 'metamask', 'regular'],
  demoUser?: string,
  demoPassword?: string,
  ssoState = 'sso'
) => {
  const endPoint = _endPoint ? new URL(_endPoint)?.origin : 'https://api.aesirx.io/';
  const optionList = aesirxAllowedLogins?.length
    ? aesirxAllowedLogins?.map((item) => `&login[]=${item}`).join('')
    : '';
  const demoAccount =
    demoUser && demoPassword ? '&demo_user=' + demoUser + '&demo_password=' + demoPassword : '';
  const popupLink = `${endPoint}/index.php?option=authorize&api=oauth2&response_type=code&client_id=${clientID}&state=${ssoState}${optionList}${demoAccount}`;
  const popup = window.open(popupLink, 'SSO', 'status=1,height=750,width=650');
  const timer = setInterval(async () => {
    if (popup.closed) {
      clearInterval(timer);
      if (window['sso_response']) {
        onGetData(window['sso_response']);
      }
    }
  }, 1000);
  window.addEventListener(
    'message',
    (e) => {
      if (e.origin !== endPoint) return;
      if (e.data && e.data.walletResponse) {
        const walletReponse = new URLSearchParams(e.data.walletResponse);
        const data = { profile: { lastVisitDate: '' } };
        walletReponse.get('access_token') &&
          Object.assign(data, { access_token: walletReponse.get('access_token') });
        walletReponse.get('expires_in') &&
          Object.assign(data, { expires_in: walletReponse.get('expires_in') });
        walletReponse.get('refresh_token') &&
          Object.assign(data, { refresh_token: walletReponse.get('refresh_token') });
        walletReponse.get('scope') && Object.assign(data, { scope: walletReponse.get('scope') });
        walletReponse.get('token_type') &&
          Object.assign(data, { scope: walletReponse.get('token_type') });
        walletReponse.get('jwt') && Object.assign(data, { jwt: walletReponse.get('jwt') });
        if (data && typeof window !== 'undefined') {
          window.sso_response = data;
          popup.close();
        }
      }
    },
    false
  );
};

const handleRegularReponse = async (
  _endPoint: string,
  ssoState: string,
  clientID: string,
  clientSecret: string
) => {
  const endPoint = _endPoint ? new URL(_endPoint)?.origin : 'https://api.aesirx.io/';
  let cache;
  const queryString = typeof window !== 'undefined' && window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (ssoState && urlParams.get('state') === ssoState) {
    if (urlParams.get('code')) {
      const fetchData = await fetch(
        endPoint +
          `/index.php?option=token&api=oauth2${ssoState === 'noscopes' ? '&state=noscopes' : ''}`,
        {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: urlParams.get('code'),
            client_id: clientID,
            client_secret: clientSecret,
          }),
          headers: assign({ 'Content-Type': 'application/json' }, { ['x-tracker-cache']: cache }),
        }
      );
      const res = await fetchData.json();
      if (res && typeof window !== 'undefined') {
        window.opener.sso_response = res;
        if (!res?.error) {
          window.close();
        }
      }
    } else if (urlParams.get('error')) {
      typeof window !== 'undefined' && window.close();
    }
  }
};

const assign = (a: any, b: any) => {
  Object.keys(b).forEach((key) => {
    if (b[key] !== undefined) a[key] = b[key];
  });
  return a;
};

const shortenString = (str: string) => {
  return str.substring(0, 6) + '...' + str.substring(str.length - 4);
};

const getClientApp = () => {
  const endpoint = window['aesirxEndpoint']
    ? window['aesirxEndpoint']
    : process.env.REACT_APP_ENDPOINT_URL ||
      process.env.NEXT_PUBLIC_ENDPOINT_URL ||
      'https://api.aesirx.io';

  const client_id = window['aesirxClientID']
    ? window['aesirxClientID']
    : process.env.REACT_APP_SSO_CLIENT_ID || process.env.NEXT_PUBLIC_SSO_CLIENT_ID || '';
  const client_secret = window['aesirxClientSecret']
    ? window['aesirxClientSecret']
    : process.env.REACT_APP_SSO_CLIENT_SECRET || process.env.NEXT_PUBLIC_SSO_CLIENT_SECRET || '';

  const network =
    process.env.REACT_APP_SSO_CONCORDIUM_NETWORK ||
    process.env.NEXT_PUBLIC_CONCORDIUM_NETWORK ||
    'mainnet';
  const web3Endpoint = window['web3Endpoint']
    ? window['web3Endpoint']
    : process.env.REACT_APP_WEB3_API_ENDPOINT ||
      process.env.NEXT_PUBLIC_WEB3_API_ENDPOINT ||
      'https://web3id.backend.aesirx.io:8001';

  const dappEndpoint = window['dappEndpoint']
    ? window['dappEndpoint']
    : process.env.REACT_APP_WEB3_DAPP_URL ||
      process.env.NEXT_PUBLIC_DAPP_URL ||
      'https://dapp.shield.aesirx.io';

  const partnerEndpoint = window['partnerEndpoint']
    ? window['partnerEndpoint']
    : process.env.REACT_APP_PARTNERS_URL ||
      process.env.NEXT_PUBLIC_PARTNERS_URL ||
      'https://partners.aesirx.io';

  const registerForm = {
    username: window['registerUsername']
      ? window['registerUsername']
      : process.env.REACT_APP_USERNAME || process.env.NEXT_PUBLIC_USERNAME || 55,
    first_name: window['registerFirstname']
      ? window['registerFirstname']
      : process.env.REACT_APP_FIRSTNAME || process.env.NEXT_PUBLIC_FIRSTNAME || 53,
    last_name: window['registerLastname']
      ? window['registerLastname']
      : process.env.REACT_APP_LASTNAME || process.env.NEXT_PUBLIC_LASTNAME || 66,
    product: window['registerProduct']
      ? window['registerProduct']
      : process.env.REACT_APP_PRODUCT || process.env.NEXT_PUBLIC_PRODUCT || 54,
    email: window['registerEmail']
      ? window['registerEmail']
      : process.env.REACT_APP_EMAIL || process.env.NEXT_PUBLIC_EMAIL || 56,
    organization: window['registerOrganization']
      ? window['registerOrganization']
      : process.env.REACT_APP_ORGANIZATION || process.env.NEXT_PUBLIC_ORGANIZATION || 57,
    message: window['registerMessage']
      ? window['registerMessage']
      : process.env.REACT_APP_MESSAGE || process.env.NEXT_PUBLIC_MESSAGE || 58,
    order_id: window['registerOrderid']
      ? window['registerOrderid']
      : process.env.REACT_APP_ORDER_ID || process.env.NEXT_PUBLIC_ORDER_ID || 64,
    code: window['registerCode']
      ? window['registerCode']
      : process.env.REACT_APP_CODE || process.env.NEXT_PUBLIC_CODE || 65,
  };
  return {
    endpoint,
    client_id,
    client_secret,
    network,
    web3Endpoint,
    dappEndpoint,
    registerForm,
    partnerEndpoint,
  };
};

const getChallenge = async (walletAccount: string) => {
  const { web3Endpoint } = getClientApp();
  try {
    return (await axios.get(`${web3Endpoint}/challenge?account=${walletAccount}`)).data?.challenge;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

const getStatement = async () => {
  const { web3Endpoint } = getClientApp();
  try {
    return (await axios.get(`${web3Endpoint}/statement`)).data;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

const verifyProof = async (challenge: any, proof: any) => {
  const { web3Endpoint } = getClientApp();
  try {
    return (
      await axios.post(
        `${web3Endpoint}/prove`,
        {
          challenge: challenge,
          proof: proof,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    ).data?.result;
  } catch (error: any) {
    console.log('getChallenge', error);
    throw error;
  }
};

const validateWeb3Id = async (id: any) => {
  const { web3Endpoint } = getClientApp();
  try {
    return !(await axios.get(`${web3Endpoint}/preregistration/checkid/${id}`)).data.result;
  } catch (error) {
    return false;
  }
};
const validateEmail = async (email: any) => {
  const { endpoint, web3Endpoint } = getClientApp();
  try {
    const [validateOnWeb3id, validateOnAesirx] = await Promise.all([
      !(await axios.get(`${web3Endpoint}/preregistration/checkemail/${email}`)).data.result,
      !(
        await axios.post(
          `${endpoint}/index.php?webserviceClient=site&webserviceVersion=1.0.0&option=member&task=checkEmailIsUsed&api=hal`,
          {
            email: email,
          }
        )
      ).data.result,
    ]);
    return validateOnWeb3id && validateOnAesirx;
  } catch (error) {
    return false;
  }
};

const registerWeb3id = async (data: any) => {
  const { dappEndpoint } = getClientApp();
  try {
    return await axios.post(`${dappEndpoint}/api/web3id`, data);
  } catch (error) {
    console.log('registerWeb3id', error);
    throw error;
  }
};

// const createAesirXAccount = async (
//   accountAddress: any,
//   connection: any,
//   email: string,
//   walletType = 'concordium'
// ) => {
//   const { endpoint } = getClientApp();
//   const nonce = (
//     await axios.post(
//       `${endpoint}/index.php?webserviceClient=site&webserviceVersion=1.0.0&option=reditem&view=item_wallet_requests_66&api=hal`,
//       {
//         public_address: accountAddress,
//         wallet: walletType,
//         text: 'Create AesirX Account : {}',
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     )
//   ).data?.nonce;

//   const signature = await connection.signMessage(accountAddress, stringMessage(`${nonce}`));

//   const signedNonce =
//     typeof signature === 'object' && signature !== null ? signature : JSON.parse(signature);

//   const aesirXID = (
//     await axios.post(
//       `${endpoint}/index.php?webserviceClient=site&webserviceVersion=1.0.0&option=reditem&view=item_wallet_requests_66&task=validateSignature&api=hal`,
//       {
//         public_address: accountAddress,
//         wallet: 'concordium',
//         signature: signedNonce,
//         email: email,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     )
//   ).data?.result?.id;
//   return aesirXID;
// };

const activation = async (web3id: any, code: any) => {
  const { web3Endpoint } = getClientApp();
  return await axios.put(`${web3Endpoint}/preregistration/activation/${web3id}/${code}`);
};

const linkAccount = async (web3Id: any, accountAddress: any, signedNonce: any) => {
  const { web3Endpoint } = getClientApp();
  await axios.put(
    `${web3Endpoint}/preregistration/id/${web3Id}/account/${accountAddress}/?signature=${signedNonce}&network=${process.env.NEXT_PUBLIC_CONCORDIUM_NETWORK}`
  );
};

const linkAesirXAccount = async (web3id: any, jwt: any) => {
  const { web3Endpoint } = getClientApp();
  await axios.put(
    `${web3Endpoint}/preregistration/aesirx/${web3id}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + jwt,
      },
    }
  );
};

const loginAesirXAccount = async (
  accountAddress: any,
  signedNonce: any,
  walletType = 'concordium'
) => {
  const { web3Endpoint } = getClientApp();
  try {
    return await axios.post(
      `${web3Endpoint}/index.php?api=hal&option=member&task=walletLogin&webserviceClient=site&webserviceVersion=1.0.0`,
      {
        publicAddress: accountAddress,
        wallet: walletType,
        signature: JSON.parse(Buffer.from(signedNonce, 'base64').toString()),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    throw Error(error);
  }
};

const createMember = async (bodyData: any) => {
  const { endpoint } = getClientApp();
  try {
    const url = `${endpoint}/index.php?webserviceClient=site&webserviceVersion=1.0.0&option=member&api=hal`;

    const rs = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    console.log('createMember', bodyData);

    return await rs.json();
  } catch (error) {
    console.log('createMember', error);
  }

  return {};
};
const login = async (username: any, password: any) => {
  const { partnerEndpoint } = getClientApp();
  try {
    const url = `${partnerEndpoint}/api/auth/login`;
    const rs = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password }),
    });
    const data = await rs.json();
    return data;
  } catch (error) {
    console.log('login error', error);
  }
};

const autoRegisterWeb3id = async (
  data: any,
  clientJwt: any,
  signedNonce: any,
  walletAccount: any
) => {
  const { dappEndpoint } = getClientApp();
  try {
    return await axios.post(`${dappEndpoint}/api/autocreate`, {
      data,
      clientJwt,
      signedNonce,
      walletAccount,
    });
  } catch (error: any) {
    console.log('autoRegisterWeb3id', error);
    throw error;
  }
};

export {
  handleWalletResponse,
  handleRegularReponse,
  shortenString,
  getClientApp,
  getChallenge,
  getStatement,
  verifyProof,
  validateWeb3Id,
  validateEmail,
  registerWeb3id,
  activation,
  linkAccount,
  linkAesirXAccount,
  loginAesirXAccount,
  createMember,
  login,
  autoRegisterWeb3id,
};
