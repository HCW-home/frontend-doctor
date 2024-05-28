// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // api: "https://doctor_hcw-athome.dev.oniabsis.com/api/v1",
  // host: "https://doctor_hcw-athome.dev.oniabsis.com/",

  api: 'http://localhost:1337/api/v1',
  host: 'http://localhost:1337/',

  //   api: 'http://192.168.1.9:1337/api/v1',
  // host: 'http://192.168.1.9:1337/',

  version: '2.0.1-2',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
//
