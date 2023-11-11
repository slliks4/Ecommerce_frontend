
// import { jwtDecode } from '/static/script/jwt-decode.js';

// const getUser = async () => {
//     const cookies = document.cookie.split(';');
//     const access = cookies.find(cookie => cookie.includes('access'));

//     if (access) {
//         const token = access.split('=')[1];

//         try {
//             const decodedToken = jwtDecode(token);

//             const userId = decodedToken.user_id;  // Assuming 'user_id' is the key in the payload
//             const username = decodedToken.username;  // Assuming 'username' is the key in the payload

//             const url = `https://type-web-production.up.railway.app/user_details/${userId}/${username}/`;

//             const response = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${access}`
//                 }
//             });

//             if (response.status !== 200) {
//                 throw new Error('Could not fetch user');
//             }

//             const object = await response.json();
//             return object;
//         } catch (err) {
//             console.error(err);
//         }
//     }
// };

// // Call the getUser function
// window.addEventListener('DOMContentLoaded', async() => {
//     try {
//         const user = await getUser();
//         console.log(user);
//     } catch (err) {
//         console.error(err);
//     }
// });
