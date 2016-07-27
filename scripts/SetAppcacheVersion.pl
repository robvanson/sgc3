#!perl
my $file = shift(@ARGV);
$file = "sw.js" unless($file);
my $header = `git log| head -3| sed 's/^/# /g'`;
open(APPCACHE, "<$file") || die "$file: $!\n";
my @appcache = <APPCACHE>;
close(APPCACHE);
open(APPCACHE, ">$file") || die "$file: $!\n";
while(my $line = shift(@appcache)) {
	if($line =~ m!^\s*var CACHE_VERSION = !) {
		if($header =~ /\# Date\:\s+(.+)\n/s) {
			$date = $1;
			$date =~ s/\s*[\+\-]\d+\s*$//g;
		};
		if($header =~ /\# commit\s+(.+)\n/s) {
			$commit = substr($1, 0, 10);
		};
		
	};
	if($line =~ m!<div id\=["']VERSION['"] style=!) {
		if($header =~ /\# Date\:\s+(.+)\n/s) {
			$date = $1;
			$date =~ s/\s*[\+\-]\d+\s*$//g;
		};
		if($header =~ /\# commit\s+(.+)\n/s) {
			$commit = substr($1, 0, 10);
		};
		$line =~ s!(<div id\=["']VERSION['"] style=["']([^"']+)["']\s*>)[^<]*(</div>)!\1V: $commit $date\3!gs;
	};
	if($line =~ /Copyrights © 2007-/) {
		my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = gmtime();
		$year += 1900;
		$line =~ s/(Copyrights © 2007-)\d+/\1$year/g;
	};
	if($line =~ /^\s*var CACHE_VERSION/) {
		$header =~ s!\# !// !g;
		print APPCACHE $header;
	};
	print APPCACHE $line unless($line =~ m!// (commit|Author\:|Date\:  ) !);
};

