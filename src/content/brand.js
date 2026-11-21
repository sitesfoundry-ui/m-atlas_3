export const brand = {
  name: "M Atlas",
  email: "hello@matlas.example",
  social: { facebook: "", instagram: "" },
};

export const hasUrl = (value) =>
  typeof value === "string" && /^https?:\/\//.test(value);
