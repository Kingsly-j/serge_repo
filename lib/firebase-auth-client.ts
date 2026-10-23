"use client";

import { getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase-public";

export const firebaseAuth = getAuth(firebaseApp);
