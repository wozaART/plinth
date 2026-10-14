// Component tests opt in to jsdom per file; unmount whatever they rendered
// after each test so queries never see a previous test's DOM.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
