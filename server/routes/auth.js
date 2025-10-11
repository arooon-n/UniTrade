import express from "express";
import { supabase } from "../lib/supabase.js";
import { createUser, getUserByEmail } from "../config/database.js";

const router = express.Router();

// Email validation function
const validateEmail = (email) => {
  const allowedDomain = "@cb.students.amrita.edu";
  console.log("Email validation debug:");
  console.log("- Email:", email);
  console.log("- Required domain:", allowedDomain);
  console.log("- Email ends with domain:", email?.endsWith(allowedDomain));
  console.log("- Email length:", email?.length);
  console.log("- Domain position:", email?.indexOf(allowedDomain));

  return email && email.endsWith(allowedDomain);
};

// Register route (alias for signup)
router.post("/register", async (req, res) => {
  try {
    // Enhanced logging to see what we're receiving
    console.log("=== REGISTER REQUEST DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("===============================");

    const { email, password, name } = req.body;

    console.log("Extracted values:");
    console.log("- email:", email, "(type:", typeof email, ")");
    console.log(
      "- password:",
      password ? "[PROVIDED]" : "[MISSING]",
      "(type:",
      typeof password,
      ")"
    );
    console.log("- name:", name, "(type:", typeof name, ")");

    // Validate required fields
    if (!email || !password || !name) {
      console.log("[][] Validation failed:");
      console.log("- email valid:", !!email);
      console.log("- password valid:", !!password);
      console.log("- name valid:", !!name);

      return res.status(400).json({
        error: "Missing required fields",
        message: "Email, password, and name are required",
        debug: {
          received: {
            email: !!email,
            password: !!password,
            name: !!name,
          },
          bodyKeys: Object.keys(req.body || {}),
          bodyType: typeof req.body,
        },
      });
    }

    // Validate email domain
    if (!validateEmail(email)) {
      console.log("[][] Invalid email domain:", email);
      return res.status(400).json({
        error: "Invalid email domain",
        message: "Email must end with @cb.students.amrita.edu",
        provided: email,
      });
    }

    console.log(
      "[][] All required fields present and email domain valid, proceeding with registration..."
    );

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(400).json({
        error: "Authentication error",
        message: authError.message,
      });
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email: authData.user.email,
      name,
      role: "student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const dbUser = await createUser(userProfile);
      console.log("User registered successfully:", dbUser.email);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If profile creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);

      return res.status(500).json({
        error: "Profile creation failed",
        message: "Failed to create user profile",
      });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred",
      debug: error.message,
    });
  }
});

// Sign up route (keeping existing functionality with email validation)
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    console.log("Signup attempt:", { email, name });

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Email, password, and name are required",
      });
    }

    // Validate email domain
    if (!email.endsWith("@cb.students.amrita.edu")) {
      console.log("[][] Email domain validation failed:", email);
      return res.status(400).json({
        error: "Invalid email domain",
        message: "Email must end with @cb.students.amrita.edu",
      });
    }

    // Validate email domain
    if (!validateEmail(email)) {
      console.log("[][] Invalid email domain:", email);
      return res.status(400).json({
        error: "Invalid email domain",
        message: "Email must end with @cb.students.amrita.edu",
        provided: email,
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(400).json({
        error: "Authentication error",
        message: authError.message,
      });
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email: authData.user.email,
      name,
      role: "student",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const dbUser = await createUser(userProfile);
      console.log("User created successfully:", dbUser.email);

      // Auto-sign in the user after registration
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        return res.status(201).json({
          message: "User created successfully, please sign in manually",
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
        });
      }

      res.status(201).json({
        message: "User created and signed in successfully",
        user: dbUser,
        token: signInData.session.access_token,
        session: signInData.session,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // If profile creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);

      return res.status(500).json({
        error: "Profile creation failed",
        message: "Failed to create user profile",
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred",
    });
  }
});

// Sign in route (with email validation)
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Signin attempt:", email);

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Email and password are required",
      });
    }

    // Validate email domain (optional for signin, but recommended)
    if (!validateEmail(email)) {
      console.log("[][] Invalid email domain for signin:", email);
      return res.status(400).json({
        error: "Invalid email domain",
        message: "Email must end with @cb.students.amrita.edu",
        provided: email,
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(401).json({
        error: "Authentication failed",
        message: authError.message,
      });
    }

    // Get user profile from database
    const userProfile = await getUserByEmail(email);

    res.json({
      message: "Sign in successful",
      user: userProfile,
      token: authData.session.access_token,
      session: authData.session,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred",
    });
  }
});

// Login route (alias for signin)
router.post("/login", async (req, res) => {
  try {
    // Enhanced logging to see what we're receiving
    console.log("=== LOGIN REQUEST DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("============================");

    const { email, password } = req.body;

    console.log("Extracted values:");
    console.log("- email:", email, "(type:", typeof email, ")");
    console.log(
      "- password:",
      password ? "[PROVIDED]" : "[MISSING]",
      "(type:",
      typeof password,
      ")"
    );

    if (!email || !password) {
      console.log("[][] Missing credentials validation failed:");
      console.log("- email valid:", !!email);
      console.log("- password valid:", !!password);

      return res.status(400).json({
        error: "Missing credentials",
        message: "Email and password are required",
        debug: {
          receivedEmail: !!email,
          receivedPassword: !!password,
          bodyKeys: Object.keys(req.body || {}),
          bodyType: typeof req.body,
        },
      });
    }

    // Validate email domain
    if (!validateEmail(email)) {
      console.log("[][] Invalid email domain:", email);
      return res.status(400).json({
        error: "Invalid email domain",
        message: "Email must end with @cb.students.amrita.edu",
        provided: email,
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(401).json({
        error: "Authentication failed",
        message: authError.message,
      });
    }

    // Get user profile from database
    const userProfile = await getUserByEmail(email);

    res.json({
      message: "Login successful",
      user: userProfile,
      token: authData.session.access_token,
      session: authData.session,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred",
    });
  }
});

// Get current user route (for /auth/me)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: "No authorization header",
        message: "Authorization token required",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Authentication token is invalid",
      });
    }

    // Get user profile from database
    const userProfile = await getUserByEmail(user.email);

    res.json({
      user: userProfile,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred",
    });
  }
});

// Test route to verify auth routes are working
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes are working!",
    emailDomainRequired: "@cb.students.amrita.edu",
  });
});

// Email validation test route
router.post("/validate-email", (req, res) => {
  const { email } = req.body;
  const isValid = validateEmail(email);

  res.json({
    email,
    isValid,
    requiredDomain: "@cb.students.amrita.edu",
    message: isValid
      ? "Email is valid"
      : "Email must end with @cb.students.amrita.edu",
  });
});

router.get("/", (req, res) => {
  res.json({
    message: "Auth API is working",
    emailDomainRequired: "@cb.students.amrita.edu",
    availableEndpoints: [
      "POST /api/auth/register - Register a new user",
      "POST /api/auth/signup - Sign up a new user (alias for register)",
      "POST /api/auth/signin - Sign in existing user",
      "POST /api/auth/login - Login existing user (alias for signin)",
      "GET /api/auth/me - Get current user profile",
      "POST /api/auth/validate-email - Test email validation",
      "GET /api/auth/test - Test endpoint",
    ],
  });
});

export default router;
