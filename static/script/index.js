import { jwtDecode } from '/static/script/jwt-decode.js';

// This function is used to check if the access token has expired
const isAccessTokenExpired = (token) => {
    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    return expirationTime < Date.now();
};

// This function is used to check if the Refresh token has expired
const isRefreshTokenExpired = (token) => {
    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    return expirationTime < Date.now();
};


// This is the login function that passes the login details to the server
const Login = async() =>{
    const loginDetails = {
        'username': 'slliks4',
        'password': 'Edward@2004'
    };

    await getTokens(loginDetails);
};

// This is the logout function it clears the access token, refresh token, and customer id from the cookies
const Logout = async () => {
    const secureCookieOptions = { secure: true, sameSite: 'Strict' };
    document.cookie = `access=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${secureCookieOptions}`;
    document.cookie = `refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${secureCookieOptions}`;
    document.cookie = `customerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${secureCookieOptions}`;
};

// This is the getToken function that gets the access token and refresh token from the server then stores it in the cookies
const getTokens = async (loginDetails) => {
    const url = 'https://type-web-production.up.railway.app/token/';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginDetails)
        });

        if (response.status !== 200) {
            throw new Error('User credentials not valid');
        }

        const object = await response.json();

        // Decode the access token to get the customer id
        const decodedToken = jwtDecode(object.access);

        const secureCookieOptions = { secure: true, sameSite: 'Strict' };
        const expires = new Date(decodedToken.exp * 1000).toUTCString(); // Set expiration based on token expiration

        document.cookie = `access=${object.access}; ${secureCookieOptions} expires=${expires};`;
        document.cookie = `refresh=${object.refresh}; ${secureCookieOptions} expires=${expires}`;
        document.cookie = `customerId=${decodedToken.customerId}; ${secureCookieOptions}`;

        console.log('User logged in successfully');
        return object;
    } catch (error) {
        console.error(error);
    }
};

// Refresh the access token. 
async function Token_refresh(refresh){
    const cookies = document.cookie.split(';');

    const url = 'https://type-web-production.up.railway.app/token/refresh/';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'refresh':refresh
            })
        })

        if (response.status !== 200){
            clearInterval(guestUserLogicInterval); 
            throw new Error ('could not fetch new tokens');
        }

        const object = await response.json();
        // Decode the access token to get the customer id
        const decodedToken = jwtDecode(object.access);

        const secureCookieOptions = { secure: true, sameSite: 'Strict' };
        const expires = new Date(decodedToken.exp * 300000).toUTCString(); // Set expiration based on token expiration

        document.cookie = `access=${object.access}; ${secureCookieOptions} expires=${expires};`;
        document.cookie = `refresh=${object.refresh}; ${secureCookieOptions}`;
        document.cookie = `customerId=${decodedToken.customerId}; ${secureCookieOptions}`;
        
        return object;
    } catch (error) {
        console.error('Error : ', error);
    }
}

// This is a logic that checks if there is an access token in the cookies,
// if there is, it checks if the access token has expired, if it has, it refreshes
// it runs logic of creating and getting guest user if there is no access token in the cookies
// it should be called in every new state and every 5 mins to refresh the access token 
// and for security reasons
const guestUserLogic = async () => {
    try {
        const cookies = document.cookie.split(';');
        const accessToken = cookies.find(cookie => cookie.includes('access'));
        const refreshToken = cookies.find(cookie => cookie.includes('refresh'));
        const refresh = refreshToken ? refreshToken.split('=')[1] : null;
        const customerId = cookies.find(cookie => cookie.includes('customerId'));
        const customer_id = customerId ? customerId.split('=')[1] : null; // Remove the '=' sign from the customerId

        // if there is no access or refresh token in the cookies
        if (!accessToken || !refreshToken) {
            // check if there is a customer ID in the cookies
            if (!customer_id) {
                // If not, show popup to ask to login or continue as guest user
                await popUp();
                return false; // Indicate that the logic was not successful
            } else {
                // User has a customer ID, fetch guest user details if needed
                try {
                    const guest = await getCustomerDetails(customer_id);
                    // if not guest, return false
                    if  (!guest){
                        return false;
                    }
                    // if guest user is not a guest, clear the access token and refresh token then show popup
                    if (guest.data.is_guest === false) {
                        await Logout();
                        await popUp();
                        return false; // Indicate that the logic was not successful
                    }
                } catch (error) {
                    console.error('Error in guestUserLogic: ', error);
                    return false;
                }
            }
        }
        // if there is an access token and refresh token in the cookies
        else if (refreshToken && accessToken){
           
            // User has an access token, check if the access token has expired
            if (isAccessTokenExpired(accessToken.split('=')[1])) {
                console.log('Access token has expired awaiting token refresh');
                try {
                    const object = await Token_refresh(refreshToken.split('=')[1]);
                    if (object){
                        console.log('Access token refreshed');
                        return true; // Indicate that the logic was successful
                    }
                } catch (error) {
                    console.error('Error refreshing token: ', error);
                    return false; // Indicate that the logic was not successful
                }
            }
            // User has an refresh token, check if the refresh token has expired
            if (isRefreshTokenExpired(refreshToken.split('=')[1])) {
                console.log('Refresh token has expired');
                await Logout();
                await popUp();
                return false; // Indicate that the logic was not successful
            }
            // check if the customer ID in the access token matches the customer ID in the refresh token
            if (customer_id !== jwtDecode(accessToken).customerId) {
                console.log('Customer ID does not match Resetting customer ID');
                // if not reset customer ID
                const secureCookieOptions = { secure: true, sameSite: 'Strict' };
                document.cookie = `customerId=${jwtDecode(accessToken).customerId}; ${secureCookieOptions}`;
            }
        }

        return true; // Indicate that the logic was successful
    } catch (error) {
        console.error('Error in guestUserLogic: ', error);
        return false; // Indicate that the logic was not successful due to an error
    }
};

// Pop up if access token not valid or customerId not valid
const popUp = async() => {
    const popup = document.querySelector('.popup');
    const login = popup.querySelector('.login');
    const guest = popup.querySelector('.guest-btn');
    const close = popup.querySelector('.closePopup');
    popup.classList.add('active');
    // calls the createGuestUser function to create a new guest user
    guest.addEventListener('click', async (event) => {
        event.preventDefault();
        await createGuestUser();
    });
    // calls the login function to login as a user
    login.addEventListener('click', async (event) => {
        event.preventDefault();
        await Login();
    });
    // calls the closePopup function to close the popup
    close.addEventListener('click', async (event) => {
        event.preventDefault();
        await closePopup();
    });
};

// Close the popup function
const closePopup = async() => {
    const popup = document.querySelector('.popup');
    popup.classList.remove('active');
};

// This is the getCustomerDetails function that gets the customer details from the server
const getCustomerDetails = async(customerId) => {
    const url = `https://type-web-production.up.railway.app/customer_details/${customerId}/`;

    try {
        const response = await fetch(url);

        // if user does not exist in the database, create a new guest user
        if (response.status === 404) {
            console.log('customer with such id does not exist awaiting creation');
            await Logout();
            await popUp();
            return;
        }else if (response.status !== 200) {
            throw new Error('could not fetch customer');
        };

        const object = await response.json();
        await closePopup();
        const secureCookieOptions = { secure: true, sameSite: 'Strict' };

        // Stores the customer id in the cookies
        document.cookie = `customerId=${object.data.customerId}; ${secureCookieOptions}`;

        return object;

    } catch (error) {
        console.error(error);
    }
};

// This is the createGuestUser function that creates a new guest user in the database
const createGuestUser = async() =>{
    const url = `https://type-web-production.up.railway.app/customer_model/`;
    
    try {
        const response = await fetch(url,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error('could not create customer');
        }
        await closePopup();
        const object = await response.json();
        const secureCookieOptions = { secure: true, sameSite: 'Strict' };

        // Stores the customer id in the cookies
        document.cookie = `customerId=${object.data.customerId}; ${secureCookieOptions}`;

        return object;
    } catch (error) {
        console.error(error);
    };
};

// The Cart function that adds a product to the cart
const addToCart = async() => {
    console.log('adding to cart');
};

window.addEventListener('DOMContentLoaded', async() => {
    
    const cartBtn = document.querySelector('.add-to-cart');
    cartBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            const logicResult = await guestUserLogic();
    
            if (logicResult) {
                // Proceed to addToCart function if logic is successful
                await addToCart();
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    });

    // timing function to refresh the access token every 28000 seconds 
    // and to check for any compromises regarding the access token, refresh token and customer ID
    try {   
        const guestUserLogicInterval = setInterval(async () => {
            await guestUserLogic();
        }, 28000);
    } catch (error) {
        console.error('Error : ',error)
    }
});