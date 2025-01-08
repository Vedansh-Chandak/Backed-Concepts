import { Router } from 'express'; // Import Router from express
import registerUser from '../controlers/user.controler.js' // Import the registerUser controller

const router = Router(); // Initialize the router

// Define the route for the 'register' endpoint

router.route('/register').post(registerUser); // Map POST requests to the registerUser controller

// Export the router
export default router;
