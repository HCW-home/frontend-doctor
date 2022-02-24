Summary: Front end for HCW@Home web application for caregiver
Name: hcw-athome-caregiver
Version: 4.3.1
Release: 2
Group: Web Application
License: HUG
Source: %{name}-%{version}.tar.gz
BuildRoot: %{_tmppath}/%{name}-root
BuildArch: noarch
BuildRequires: nodejs
BuildRequires: git

%define _binaries_in_noarch_packages_terminate_build   0

%description
SPECS version 1

%prep
#%setup -c SPECS
%__rm -rf %{_topdir}/BUILD
%__cp -a %{_sourcedir} %{_topdir}/BUILD

%install
make build
%{__install} -d -m0755 %{buildroot}/%{_datadir}/hcw-athome/caregiver
%{__cp} -a dist/hug-at-home/* %{buildroot}/%{_datadir}/hcw-athome/caregiver/

%clean
%{__rm} -rf %{buildroot}

%files
%defattr(-,root,root, 0755)
%{_datadir}/hcw-athome/

%post
## Commands to for the post install


%changelog
* Wed Apr 17 2019 Olivier Bitsch <olivier.b@iabsis.com>
- Initial spec file for hug-home-web package.
