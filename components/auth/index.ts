export { GallerySignIn, GallerySignUp, GalleryForgot } from "./GalleryForms";
export { ArtistSignIn, ArtistInvite } from "./ArtistForms";

import { GallerySignIn, GallerySignUp, GalleryForgot } from "./GalleryForms";
import { ArtistSignIn, ArtistInvite } from "./ArtistForms";

export const GalleryForms = {
  SignIn: GallerySignIn,
  SignUp: GallerySignUp,
  Forgot: GalleryForgot,
};

export const ArtistForms = {
  SignIn: ArtistSignIn,
  Invite: ArtistInvite,
};
