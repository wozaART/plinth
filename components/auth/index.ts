export { GallerySignIn, GallerySignUp, GalleryForgot } from "./GalleryForms";
export { ArtistSignIn, ArtistForgot, ArtistInvite } from "./ArtistForms";

import { GallerySignIn, GallerySignUp, GalleryForgot } from "./GalleryForms";
import { ArtistSignIn, ArtistForgot, ArtistInvite } from "./ArtistForms";

export const GalleryForms = {
  SignIn: GallerySignIn,
  SignUp: GallerySignUp,
  Forgot: GalleryForgot,
};

export const ArtistForms = {
  SignIn: ArtistSignIn,
  Forgot: ArtistForgot,
  Invite: ArtistInvite,
};
